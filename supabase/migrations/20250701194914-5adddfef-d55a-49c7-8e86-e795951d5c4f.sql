-- Add missing page access features to feature hierarchy
INSERT INTO public.feature_hierarchy (feature_name, category, display_name, description, min_plan_level) VALUES
('page_access_billing', 'page_access', 'Billing Page', 'Access to billing and subscription management', 0),
('page_access_settings', 'page_access', 'Settings Page', 'Access to user settings and preferences', 0),
('page_access_dashboard', 'page_access', 'Dashboard Page', 'Access to main dashboard', 0)
ON CONFLICT (feature_name) DO UPDATE SET
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  min_plan_level = EXCLUDED.min_plan_level;

-- Add these features to all plan types
INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled)
SELECT 
  plan_type,
  'page_access_billing',
  NULL,
  true
FROM (VALUES ('starter'::plan_type), ('pro'::plan_type), ('growth'::plan_type), ('elite'::plan_type)) AS plans(plan_type)
ON CONFLICT (plan_type, feature_name) DO UPDATE SET is_enabled = true;

INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled)
SELECT 
  plan_type,
  'page_access_settings',
  NULL,
  true
FROM (VALUES ('starter'::plan_type), ('pro'::plan_type), ('growth'::plan_type), ('elite'::plan_type)) AS plans(plan_type)
ON CONFLICT (plan_type, feature_name) DO UPDATE SET is_enabled = true;

INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled)
SELECT 
  plan_type,
  'page_access_dashboard',
  NULL,
  true
FROM (VALUES ('starter'::plan_type), ('pro'::plan_type), ('growth'::plan_type), ('elite'::plan_type)) AS plans(plan_type)
ON CONFLICT (plan_type, feature_name) DO UPDATE SET is_enabled = true;