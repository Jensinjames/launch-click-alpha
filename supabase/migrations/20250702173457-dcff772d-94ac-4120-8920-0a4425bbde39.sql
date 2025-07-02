-- Fix the can_access_feature function by removing problematic search_path restriction
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