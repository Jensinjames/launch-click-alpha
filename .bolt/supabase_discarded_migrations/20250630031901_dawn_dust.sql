-- Migration to adjust plan_type enum and add is_active columns for tiered access system

-- First, drop all policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can view plan features" ON plan_features;
DROP POLICY IF EXISTS "Only super admins can manage plan features" ON plan_features;

-- Drop existing policies on user_plans to recreate them
DROP POLICY IF EXISTS "Users can insert own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;

-- Drop existing policies on content_templates to recreate them
DROP POLICY IF EXISTS "Users can view accessible templates" ON content_templates;
DROP POLICY IF EXISTS "Users can view public templates and own templates" ON content_templates;

-- 1. Add 'free' to the plan_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
        ALTER TYPE plan_type ADD VALUE 'free';
    END IF;
END$$;

-- 2. Update existing 'starter' plans to 'free' in user_plans table
UPDATE user_plans SET plan_type = 'free' WHERE plan_type = 'starter';

-- 3. Update existing 'starter' min_plan_type in content_templates table to 'free'
UPDATE content_templates SET min_plan_type = 'free' WHERE min_plan_type = 'starter';

-- 4. Add 'is_active' column to user_plans table if it doesn't exist
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 5. Add 'is_active' column to content_templates table if it doesn't exist
ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 6. Create updated RLS policies for user_plans to consider 'is_active'
CREATE POLICY "Users can insert own plan"
  ON user_plans
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan"
  ON user_plans
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plan"
  ON user_plans
  FOR SELECT
  TO public
  USING (auth.uid() = user_id AND is_active = TRUE);

-- 7. Update the can_access_template function to handle 'free' instead of 'starter'
DROP FUNCTION IF EXISTS can_access_template(plan_type, uuid);
CREATE OR REPLACE FUNCTION can_access_template(template_min_plan_type plan_type, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plans up
    WHERE up.user_id = COALESCE(user_id, auth.uid())
    AND up.is_active = TRUE -- Only consider active plans
    AND (
      template_min_plan_type = 'free'
      OR (template_min_plan_type = 'pro' AND up.plan_type IN ('pro', 'growth', 'elite'))
      OR (template_min_plan_type = 'growth' AND up.plan_type IN ('growth', 'elite'))
      OR (template_min_plan_type = 'elite' AND up.plan_type = 'elite')
    )
  );
$$;

-- 8. Create updated RLS policies for content_templates to consider 'is_active'
CREATE POLICY "Users can view accessible templates"
  ON content_templates
  FOR SELECT
  TO public
  USING (
    (is_public = true AND is_active = TRUE AND can_access_template(min_plan_type, auth.uid()))
    OR (created_by = auth.uid())
  );

CREATE POLICY "Users can create own templates"
  ON content_templates
  FOR INSERT
  TO public
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON content_templates
  FOR UPDATE
  TO public
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON content_templates
  FOR DELETE
  TO public
  USING (created_by = auth.uid());

-- 9. Recreate plan_features policies without conflicts
CREATE POLICY "Authenticated users can view plan features"
  ON plan_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can manage plan features"
  ON plan_features
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 10. Grant execute permission on the updated function
GRANT EXECUTE ON FUNCTION can_access_template(plan_type, uuid) TO authenticated, public;

-- 11. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plans_active ON user_plans (user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_templates_active ON content_templates (is_active, is_public, min_plan_type) WHERE is_active = TRUE;

-- 12. Update existing data to ensure consistency
UPDATE user_plans SET is_active = TRUE WHERE is_active IS NULL;
UPDATE content_templates SET is_active = TRUE WHERE is_active IS NULL;

-- 13. Add some sample tiered templates for different plan levels
INSERT INTO content_templates (name, description, type, template_data, is_public, created_by, min_plan_type, tags, is_active)
SELECT 
  'Basic Email Template',
  'Simple email template for getting started',
  'email_sequence',
  '{"subject": "Welcome!", "body": "Thank you for joining us."}',
  true,
  id,
  'free',
  ARRAY['email', 'basic'],
  true
FROM profiles 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO content_templates (name, description, type, template_data, is_public, created_by, min_plan_type, tags, is_active)
SELECT 
  'Professional Landing Page',
  'Advanced landing page template with conversion optimization',
  'landing_page',
  '{"sections": ["hero", "features", "testimonials", "cta"], "conversion_optimized": true}',
  true,
  id,
  'pro',
  ARRAY['landing', 'professional', 'conversion'],
  true
FROM profiles 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO content_templates (name, description, type, template_data, is_public, created_by, min_plan_type, tags, is_active)
SELECT 
  'Growth Marketing Campaign',
  'Complete growth marketing campaign with analytics and A/B testing',
  'funnel',
  '{"stages": ["awareness", "acquisition", "activation", "retention"], "ab_testing": true, "analytics": true}',
  true,
  id,
  'growth',
  ARRAY['growth', 'campaign', 'analytics'],
  true
FROM profiles 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO content_templates (name, description, type, template_data, is_public, created_by, min_plan_type, tags, is_active)
SELECT 
  'Enterprise Strategy Framework',
  'Comprehensive enterprise-level strategy framework with advanced features',
  'strategy_brief',
  '{"framework": "enterprise", "features": ["market_analysis", "competitive_intelligence", "roi_modeling"], "advanced": true}',
  true,
  id,
  'elite',
  ARRAY['enterprise', 'strategy', 'advanced'],
  true
FROM profiles 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 14. Attempt to remove 'starter' from enum (this may fail if there are still dependencies)
-- We'll do this in a separate block to handle potential errors gracefully
DO $$
BEGIN
    -- Check if any columns still use 'starter'
    IF NOT EXISTS (
        SELECT 1 FROM user_plans WHERE plan_type = 'starter'
        UNION ALL
        SELECT 1 FROM content_templates WHERE min_plan_type = 'starter'
    ) THEN
        -- Only attempt to drop if no references exist
        BEGIN
            ALTER TYPE plan_type DROP VALUE IF EXISTS 'starter';
        EXCEPTION WHEN OTHERS THEN
            -- Log that we couldn't drop the value, but continue
            RAISE NOTICE 'Could not drop starter value from plan_type enum: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Cannot drop starter value - still in use by some records';
    END IF;
END$$;

-- 15. Ensure all tables have proper RLS enabled
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- 16. Add helpful comments for documentation
COMMENT ON COLUMN user_plans.is_active IS 'Whether this user plan is currently active and should be considered for access control';
COMMENT ON COLUMN content_templates.is_active IS 'Whether this template is active and available for use';
COMMENT ON FUNCTION can_access_template(plan_type, uuid) IS 'Checks if a user can access a template based on their plan type and the template minimum plan requirement';