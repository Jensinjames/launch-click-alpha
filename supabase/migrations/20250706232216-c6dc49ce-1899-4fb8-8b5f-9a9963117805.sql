-- Fix Feature Access Issues - Add missing features and fix access logic

-- 1. Add missing page access features to feature_hierarchy
INSERT INTO public.feature_hierarchy (feature_name, category, display_name, description, min_plan_level, is_active) VALUES
('page_access_integrations', 'page_access', 'Integrations Page', 'Access to integrations page and basic integration management', 0, true),
('page_access_billing', 'page_access', 'Billing Page', 'Access to billing and subscription management', 0, true),
('page_access_settings', 'page_access', 'Settings Page', 'Access to user settings and preferences', 0, true)
ON CONFLICT (feature_name) DO UPDATE SET
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  min_plan_level = EXCLUDED.min_plan_level,
  is_active = EXCLUDED.is_active;

-- 2. Fix the can_access_feature function - the logic was incorrectly blocking level 0 features
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

-- 3. Ensure all essential page access features are set to level 0 (available to all authenticated users)
UPDATE public.feature_hierarchy 
SET min_plan_level = 0, is_active = true
WHERE feature_name IN (
  'page_access_dashboard',
  'page_access_generate', 
  'page_access_content',
  'page_access_teams',
  'page_access_analytics',
  'page_access_integrations',
  'page_access_settings',
  'page_access_billing'
) AND category = 'page_access';

-- 4. Add any missing basic page access features that might be needed
INSERT INTO public.feature_hierarchy (feature_name, category, display_name, description, min_plan_level, is_active) VALUES
('page_access_dashboard', 'page_access', 'Dashboard Page', 'Access to main dashboard', 0, true),
('page_access_generate', 'page_access', 'Generate Page', 'Access to content generation interface', 0, true),
('page_access_content', 'page_access', 'Content Page', 'Access to content library and management', 0, true)
ON CONFLICT (feature_name) DO UPDATE SET
  min_plan_level = 0,
  is_active = true;