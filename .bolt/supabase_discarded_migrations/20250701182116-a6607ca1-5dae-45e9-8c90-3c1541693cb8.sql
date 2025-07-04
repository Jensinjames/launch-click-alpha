-- Phase 1: Clean Feature Hierarchy & Data Model
-- Create feature hierarchy mapping table for clean organization
CREATE TABLE IF NOT EXISTS public.feature_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'page_access', 'advanced_feature', 'basic_feature'
  display_name TEXT NOT NULL,
  description TEXT,
  min_plan_level INTEGER NOT NULL DEFAULT 0, -- 0=all users, 1=starter, 2=pro, 3=growth, 4=elite
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert clean feature definitions
INSERT INTO public.feature_hierarchy (feature_name, category, display_name, description, min_plan_level) VALUES
-- Page Access (Available to all authenticated users)
('page_access_teams', 'page_access', 'Teams Page', 'Basic teams page access and team creation', 0),
('page_access_analytics', 'page_access', 'Analytics Page', 'Basic analytics dashboard access', 0),
('page_access_content', 'page_access', 'Content Page', 'Content library and management', 0),
('page_access_generate', 'page_access', 'Generate Page', 'AI content generation interface', 0),

-- Basic Features (Available to all authenticated users with plan limits)
('content_generation', 'basic_feature', 'Content Generation', 'AI-powered content creation with plan limits', 0),
('templates_basic', 'basic_feature', 'Basic Templates', 'Access to starter templates', 0),
('team_create_basic', 'basic_feature', 'Basic Team Creation', 'Create and join one team', 0),

-- Advanced Features (Paid plans only)
('teams_advanced', 'advanced_feature', 'Advanced Team Management', 'Multiple teams, advanced member management', 3), -- growth+
('analytics_advanced', 'advanced_feature', 'Advanced Analytics', 'Custom reports, exports, detailed metrics', 2), -- pro+
('integrations', 'advanced_feature', 'Integrations', 'Third-party service integrations', 3), -- growth+
('templates_advanced', 'advanced_feature', 'Advanced Templates', 'Premium template library', 2), -- pro+
('collaboration', 'advanced_feature', 'Content Collaboration', 'Multi-user content collaboration', 2) -- pro+
ON CONFLICT (feature_name) DO UPDATE SET
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  min_plan_level = EXCLUDED.min_plan_level;

-- Create secure feature access function with clear hierarchy
CREATE OR REPLACE FUNCTION public.can_access_feature(
  feature_name TEXT,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan_level INTEGER;
  feature_min_level INTEGER;
  is_authenticated BOOLEAN;
BEGIN
  -- Check if user is authenticated
  is_authenticated := check_user_id IS NOT NULL;
  
  -- If not authenticated, deny all access
  IF NOT is_authenticated THEN
    RETURN FALSE;
  END IF;
  
  -- Get feature minimum level requirement
  SELECT min_plan_level INTO feature_min_level
  FROM public.feature_hierarchy
  WHERE feature_hierarchy.feature_name = can_access_feature.feature_name
    AND is_active = true;
    
  -- If feature not found, deny access (fail secure)
  IF feature_min_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If feature requires no plan (level 0), allow all authenticated users
  IF feature_min_level = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Get user's plan level
  SELECT 
    CASE up.plan_type
      WHEN 'starter' THEN 1
      WHEN 'pro' THEN 2  
      WHEN 'growth' THEN 3
      WHEN 'elite' THEN 4
      ELSE 0
    END INTO user_plan_level
  FROM public.user_plans up
  WHERE up.user_id = check_user_id;
  
  -- If no plan found, treat as level 0 (authenticated but no plan)
  user_plan_level := COALESCE(user_plan_level, 0);
  
  -- Check if user's plan level meets feature requirement
  RETURN user_plan_level >= feature_min_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create contract boundary validation function
CREATE OR REPLACE FUNCTION public.can_access_with_contract(
  feature_name TEXT,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check basic feature access
  IF NOT public.can_access_feature(feature_name, check_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Add contract-specific validation here when contracts are implemented
  -- For now, just return the basic feature access result
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update existing plan_features table to align with new hierarchy
-- Keep existing data but ensure consistency
UPDATE public.plan_features SET is_enabled = true 
WHERE feature_name IN ('content_generation', 'templates_access');

-- Add missing basic features for all plans
INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled)
SELECT 
  plan_type,
  'page_access_teams',
  NULL,
  true
FROM (VALUES ('starter'::plan_type), ('pro'::plan_type), ('growth'::plan_type), ('elite'::plan_type)) AS plans(plan_type)
ON CONFLICT (plan_type, feature_name) DO UPDATE SET is_enabled = true;

INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled)
SELECT 
  plan_type,
  'page_access_analytics', 
  NULL,
  true
FROM (VALUES ('starter'::plan_type), ('pro'::plan_type), ('growth'::plan_type), ('elite'::plan_type)) AS plans(plan_type)
ON CONFLICT (plan_type, feature_name) DO UPDATE SET is_enabled = true;

-- Create audit logging for access decisions
CREATE OR REPLACE FUNCTION public.log_feature_access(
  p_feature_name TEXT,
  p_access_granted BOOLEAN,
  p_user_id UUID DEFAULT auth.uid(),
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    new_values
  ) VALUES (
    p_user_id,
    CASE WHEN p_access_granted THEN 'feature_access_granted' ELSE 'feature_access_denied' END,
    'feature_access',
    jsonb_build_object(
      'feature_name', p_feature_name,
      'access_granted', p_access_granted,
      'context', p_context,
      'timestamp', now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;