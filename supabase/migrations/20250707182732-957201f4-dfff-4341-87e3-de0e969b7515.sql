-- Add missing feature for assemblies page access
INSERT INTO public.feature_hierarchy (
  feature_name,
  display_name,
  description,
  category,
  min_plan_level,
  is_active
) VALUES (
  'page_access_assemblies',
  'Content Assemblies',
  'Access to create and manage content assemblies',
  'content',
  1,
  true
) ON CONFLICT (feature_name) DO NOTHING;