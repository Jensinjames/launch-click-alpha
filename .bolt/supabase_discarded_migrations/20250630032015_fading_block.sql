/*
  # Tiered Plan System Migration

  1. Plan Type Updates
    - Add 'free' to plan_type enum
    - Update existing 'starter' references to 'free'
    - Add is_active columns for soft deletion

  2. Enhanced Access Control
    - Update can_access_template function for new plan hierarchy
    - Create RLS policies considering active status

  3. Performance Optimizations
    - Add indexes for efficient querying
    - Composite indexes for common patterns

  4. Sample Data
    - Add tiered templates for each plan level
*/

-- Step 1: Add 'free' to the plan_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
        ALTER TYPE plan_type ADD VALUE 'free';
        -- Force a commit point to make the new enum value available
        COMMIT;
    END IF;
END$$;

-- Step 2: Add is_active columns first (before updating enum references)
DO $$
BEGIN
    -- Add is_active to user_plans if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_plans' AND column_name = 'is_active') THEN
        ALTER TABLE user_plans ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add is_active to content_templates if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_templates' AND column_name = 'is_active') THEN
        ALTER TABLE content_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END$$;

-- Step 3: Update existing data to use 'free' instead of 'starter'
-- This needs to be in a separate transaction after the enum value is committed
DO $$
BEGIN
    -- Update user_plans table
    UPDATE user_plans SET plan_type = 'free' WHERE plan_type = 'starter';
    
    -- Update content_templates table
    UPDATE content_templates SET min_plan_type = 'free' WHERE min_plan_type = 'starter';
    
    -- Ensure is_active columns are properly set
    UPDATE user_plans SET is_active = TRUE WHERE is_active IS NULL;
    UPDATE content_templates SET is_active = TRUE WHERE is_active IS NULL;
END$$;

-- Step 4: Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view plan features" ON plan_features;
DROP POLICY IF EXISTS "Only super admins can manage plan features" ON plan_features;
DROP POLICY IF EXISTS "Users can insert own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can view accessible templates" ON content_templates;
DROP POLICY IF EXISTS "Users can view public templates and own templates" ON content_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON content_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON content_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON content_templates;

-- Step 5: Update the can_access_template function
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
    AND up.is_active = TRUE
    AND up.status = 'active'
    AND (
      template_min_plan_type = 'free'
      OR (template_min_plan_type = 'pro' AND up.plan_type IN ('pro', 'growth', 'elite'))
      OR (template_min_plan_type = 'growth' AND up.plan_type IN ('growth', 'elite'))
      OR (template_min_plan_type = 'elite' AND up.plan_type = 'elite')
    )
  );
$$;

-- Step 6: Create new RLS policies for user_plans
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

CREATE POLICY "Users can view own active plan"
  ON user_plans
  FOR SELECT
  TO public
  USING (auth.uid() = user_id AND is_active = TRUE);

-- Step 7: Create new RLS policies for content_templates
CREATE POLICY "Users can view accessible active templates"
  ON content_templates
  FOR SELECT
  TO public
  USING (
    is_active = TRUE AND (
      (is_public = true AND can_access_template(min_plan_type, auth.uid()))
      OR (created_by = auth.uid())
    )
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

-- Step 8: Recreate plan_features policies
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

-- Step 9: Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_access_template(plan_type, uuid) TO authenticated, public;

-- Step 10: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_active_status 
  ON user_plans (user_id, is_active, status) 
  WHERE is_active = TRUE AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_content_templates_access 
  ON content_templates (is_active, is_public, min_plan_type) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_content_templates_user_active 
  ON content_templates (created_by, is_active) 
  WHERE is_active = TRUE;

-- Step 11: Ensure RLS is enabled on all relevant tables
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Step 12: Add sample tiered templates
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get a super admin user ID for creating sample templates
    SELECT id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'super_admin' 
    LIMIT 1;
    
    -- Only create samples if we have an admin user
    IF admin_user_id IS NOT NULL THEN
        -- Free tier template
        INSERT INTO content_templates (
            name, description, type, template_data, is_public, 
            created_by, min_plan_type, tags, is_active
        ) VALUES (
            'Basic Email Welcome',
            'Simple welcome email template for new users',
            'email_sequence',
            '{"subject": "Welcome to our platform!", "body": "Thank you for joining us. We are excited to have you on board.", "tone": "friendly"}',
            true,
            admin_user_id,
            'free',
            ARRAY['email', 'welcome', 'basic'],
            true
        ) ON CONFLICT DO NOTHING;
        
        -- Pro tier template
        INSERT INTO content_templates (
            name, description, type, template_data, is_public, 
            created_by, min_plan_type, tags, is_active
        ) VALUES (
            'Professional Landing Page',
            'Conversion-optimized landing page with advanced features',
            'landing_page',
            '{"sections": ["hero", "benefits", "social_proof", "cta"], "conversion_elements": ["urgency", "testimonials"], "advanced": true}',
            true,
            admin_user_id,
            'pro',
            ARRAY['landing', 'professional', 'conversion'],
            true
        ) ON CONFLICT DO NOTHING;
        
        -- Growth tier template
        INSERT INTO content_templates (
            name, description, type, template_data, is_public, 
            created_by, min_plan_type, tags, is_active
        ) VALUES (
            'Growth Marketing Funnel',
            'Complete growth marketing funnel with analytics tracking',
            'funnel',
            '{"stages": ["awareness", "interest", "consideration", "purchase", "retention"], "analytics": true, "ab_testing": true, "advanced_targeting": true}',
            true,
            admin_user_id,
            'growth',
            ARRAY['growth', 'funnel', 'analytics', 'marketing'],
            true
        ) ON CONFLICT DO NOTHING;
        
        -- Elite tier template
        INSERT INTO content_templates (
            name, description, type, template_data, is_public, 
            created_by, min_plan_type, tags, is_active
        ) VALUES (
            'Enterprise Strategy Framework',
            'Comprehensive enterprise strategy with market analysis and competitive intelligence',
            'strategy_brief',
            '{"components": ["market_analysis", "competitive_landscape", "swot_analysis", "roi_projections"], "enterprise_features": true, "custom_integrations": true}',
            true,
            admin_user_id,
            'elite',
            ARRAY['enterprise', 'strategy', 'analysis', 'advanced'],
            true
        ) ON CONFLICT DO NOTHING;
    END IF;
END$$;

-- Step 13: Add helpful documentation comments
COMMENT ON COLUMN user_plans.is_active IS 'Indicates if this user plan is currently active and should be considered for access control';
COMMENT ON COLUMN content_templates.is_active IS 'Indicates if this template is active and available for users to access';
COMMENT ON FUNCTION can_access_template(plan_type, uuid) IS 'Determines if a user can access a template based on their active plan type and the template minimum plan requirement';

-- Step 14: Create a helper function to check user plan access
CREATE OR REPLACE FUNCTION get_user_plan_info(check_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
    plan_type plan_type,
    credits integer,
    team_seats integer,
    can_manage_teams boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    up.plan_type,
    up.credits,
    up.team_seats,
    (up.plan_type IN ('growth', 'elite')) as can_manage_teams
  FROM user_plans up
  WHERE up.user_id = check_user_id 
  AND up.is_active = TRUE 
  AND up.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_plan_info(uuid) TO authenticated, public;

-- Step 15: Attempt to remove 'starter' from enum (graceful handling)
DO $$
BEGIN
    -- Check if any records still reference 'starter'
    IF NOT EXISTS (
        SELECT 1 FROM user_plans WHERE plan_type = 'starter'
        UNION ALL
        SELECT 1 FROM content_templates WHERE min_plan_type = 'starter'
        UNION ALL
        SELECT 1 FROM plan_features WHERE plan_type = 'starter'
    ) THEN
        -- Attempt to remove the old enum value
        BEGIN
            -- Note: PostgreSQL doesn't support DROP VALUE for enums directly
            -- We'll leave 'starter' in the enum but document that it's deprecated
            RAISE NOTICE 'All starter references updated to free. The starter enum value remains for compatibility but should not be used.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not modify plan_type enum: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Some records still reference starter plan type - manual cleanup may be required';
    END IF;
END$$;

-- Step 16: Final verification and cleanup
DO $$
DECLARE
    starter_count integer;
    free_count integer;
BEGIN
    -- Count remaining starter references
    SELECT COUNT(*) INTO starter_count 
    FROM user_plans 
    WHERE plan_type = 'starter';
    
    SELECT COUNT(*) INTO free_count 
    FROM user_plans 
    WHERE plan_type = 'free';
    
    RAISE NOTICE 'Migration completed. Starter plans remaining: %, Free plans: %', starter_count, free_count;
END$$;