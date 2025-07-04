/*
  # Tiered Content Generation System Migration

  This migration implements a comprehensive tiered access system with the following changes:
  
  1. Database Schema Updates
     - Add 'free' to plan_type enum (replacing 'starter')
     - Add is_active columns to user_plans and content_templates
     - Update existing data to use new plan structure
  
  2. Access Control
     - Enhanced RLS policies for plan-based access
     - Updated functions for template access checking
     - Proper security policies for all tiers
  
  3. Sample Data
     - Tiered content templates for each plan level
     - Proper metadata and feature differentiation
*/

-- Step 1: Add 'free' to the plan_type enum if it doesn't exist
-- We need to do this outside of a DO block to avoid transaction issues
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'free';

-- Step 2: Add is_active columns to tables
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 3: Update existing data to use 'free' instead of 'starter'
UPDATE user_plans SET plan_type = 'free' WHERE plan_type = 'starter';
UPDATE content_templates SET min_plan_type = 'free' WHERE min_plan_type = 'starter';

-- Step 4: Ensure is_active columns are properly initialized
UPDATE user_plans SET is_active = TRUE WHERE is_active IS NULL;
UPDATE content_templates SET is_active = TRUE WHERE is_active IS NULL;

-- Step 5: Drop existing conflicting policies
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

-- Step 6: Update the can_access_template function to handle new plan structure
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

-- Step 7: Create helper function for getting user plan information
CREATE OR REPLACE FUNCTION get_user_plan_info(check_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
    plan_type plan_type,
    credits integer,
    team_seats integer,
    can_manage_teams boolean,
    is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    up.plan_type,
    up.credits,
    up.team_seats,
    (up.plan_type IN ('growth', 'elite')) as can_manage_teams,
    up.is_active
  FROM user_plans up
  WHERE up.user_id = check_user_id 
  AND up.is_active = TRUE 
  AND up.status = 'active'
  LIMIT 1;
$$;

-- Step 8: Create new RLS policies for user_plans with is_active consideration
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

-- Step 9: Create new RLS policies for content_templates with tiered access
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

-- Step 10: Recreate plan_features policies
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

-- Step 11: Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_access_template(plan_type, uuid) TO authenticated, public;
GRANT EXECUTE ON FUNCTION get_user_plan_info(uuid) TO authenticated, public;

-- Step 12: Add performance indexes for tiered access queries
CREATE INDEX IF NOT EXISTS idx_user_plans_active_status 
  ON user_plans (user_id, is_active, status) 
  WHERE is_active = TRUE AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_content_templates_access 
  ON content_templates (is_active, is_public, min_plan_type) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_content_templates_user_active 
  ON content_templates (created_by, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_content_templates_plan_type 
  ON content_templates (min_plan_type, is_active, is_public)
  WHERE is_active = TRUE;

-- Step 13: Ensure RLS is enabled on all relevant tables
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Step 14: Add sample tiered templates for demonstration
-- We'll use a simpler approach to avoid transaction issues
INSERT INTO content_templates (
    name, description, type, template_data, is_public, 
    created_by, min_plan_type, tags, is_active
)
SELECT 
    'Basic Email Welcome',
    'Simple welcome email template for new users',
    'email_sequence',
    '{"subject": "Welcome to our platform!", "body": "Thank you for joining us. We are excited to have you on board.", "tone": "friendly", "features": ["basic_personalization"]}',
    true,
    p.id,
    'free',
    ARRAY['email', 'welcome', 'basic'],
    true
FROM profiles p 
WHERE p.role = 'super_admin' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO content_templates (
    name, description, type, template_data, is_public, 
    created_by, min_plan_type, tags, is_active
)
SELECT 
    'Professional Landing Page',
    'Conversion-optimized landing page with advanced features',
    'landing_page',
    '{"sections": ["hero", "benefits", "social_proof", "cta"], "conversion_elements": ["urgency", "testimonials"], "advanced": true, "features": ["a_b_testing", "analytics"]}',
    true,
    p.id,
    'pro',
    ARRAY['landing', 'professional', 'conversion'],
    true
FROM profiles p 
WHERE p.role = 'super_admin' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO content_templates (
    name, description, type, template_data, is_public, 
    created_by, min_plan_type, tags, is_active
)
SELECT 
    'Growth Marketing Funnel',
    'Complete growth marketing funnel with analytics tracking',
    'funnel',
    '{"stages": ["awareness", "interest", "consideration", "purchase", "retention"], "analytics": true, "ab_testing": true, "advanced_targeting": true, "features": ["multi_channel", "automation", "advanced_analytics"]}',
    true,
    p.id,
    'growth',
    ARRAY['growth', 'funnel', 'analytics', 'marketing'],
    true
FROM profiles p 
WHERE p.role = 'super_admin' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO content_templates (
    name, description, type, template_data, is_public, 
    created_by, min_plan_type, tags, is_active
)
SELECT 
    'Enterprise Strategy Framework',
    'Comprehensive enterprise strategy with market analysis and competitive intelligence',
    'strategy_brief',
    '{"components": ["market_analysis", "competitive_landscape", "swot_analysis", "roi_projections"], "enterprise_features": true, "custom_integrations": true, "features": ["white_label", "custom_branding", "dedicated_support"]}',
    true,
    p.id,
    'elite',
    ARRAY['enterprise', 'strategy', 'analysis', 'advanced'],
    true
FROM profiles p 
WHERE p.role = 'super_admin' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

-- Step 15: Add some plan-specific features to plan_features table
INSERT INTO plan_features (plan_type, feature_name, feature_limit, is_enabled)
VALUES 
    ('free', 'monthly_credits', 50, true),
    ('free', 'team_seats', 1, true),
    ('free', 'basic_templates', NULL, true),
    ('pro', 'monthly_credits', 500, true),
    ('pro', 'team_seats', 3, true),
    ('pro', 'advanced_templates', NULL, true),
    ('pro', 'analytics', NULL, true),
    ('growth', 'monthly_credits', 2000, true),
    ('growth', 'team_seats', 10, true),
    ('growth', 'team_collaboration', NULL, true),
    ('growth', 'advanced_analytics', NULL, true),
    ('growth', 'integrations', NULL, true),
    ('elite', 'monthly_credits', NULL, true),
    ('elite', 'team_seats', NULL, true),
    ('elite', 'white_label', NULL, true),
    ('elite', 'custom_integrations', NULL, true),
    ('elite', 'dedicated_support', NULL, true)
ON CONFLICT (plan_type, feature_name) DO NOTHING;

-- Step 16: Add helpful documentation comments
COMMENT ON COLUMN user_plans.is_active IS 'Indicates if this user plan is currently active and should be considered for access control';
COMMENT ON COLUMN content_templates.is_active IS 'Indicates if this template is active and available for users to access';
COMMENT ON FUNCTION can_access_template(plan_type, uuid) IS 'Determines if a user can access a template based on their active plan type and the template minimum plan requirement';
COMMENT ON FUNCTION get_user_plan_info(uuid) IS 'Returns comprehensive plan information for a user including access capabilities';

-- Step 17: Create a view for easy plan access checking
CREATE OR REPLACE VIEW user_plan_access AS
SELECT 
    up.user_id,
    up.plan_type,
    up.credits,
    up.team_seats,
    up.is_active,
    up.status,
    (up.plan_type IN ('growth', 'elite')) as can_manage_teams,
    (up.plan_type IN ('pro', 'growth', 'elite')) as has_advanced_features,
    (up.plan_type = 'elite') as has_enterprise_features
FROM user_plans up
WHERE up.is_active = TRUE AND up.status = 'active';

-- Grant access to the view
GRANT SELECT ON user_plan_access TO authenticated, public;

-- Step 18: Add RLS policy for the view
ALTER VIEW user_plan_access SET (security_barrier = true);
CREATE POLICY "Users can view own plan access info"
  ON user_plan_access
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

-- Step 19: Final verification - count the migration results
DO $$
DECLARE
    free_plans integer;
    starter_plans integer;
    active_templates integer;
    total_features integer;
BEGIN
    SELECT COUNT(*) INTO free_plans FROM user_plans WHERE plan_type = 'free';
    SELECT COUNT(*) INTO starter_plans FROM user_plans WHERE plan_type = 'starter';
    SELECT COUNT(*) INTO active_templates FROM content_templates WHERE is_active = true;
    SELECT COUNT(*) INTO total_features FROM plan_features;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Free plans: %', free_plans;
    RAISE NOTICE '- Starter plans remaining: %', starter_plans;
    RAISE NOTICE '- Active templates: %', active_templates;
    RAISE NOTICE '- Plan features configured: %', total_features;
    RAISE NOTICE 'Tiered content generation system migration completed successfully!';
END$$;