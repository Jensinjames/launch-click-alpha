-- Add marketing image generation feature to feature hierarchy
INSERT INTO public.feature_hierarchy (
  feature_name,
  display_name,
  description,
  category,
  min_plan_level,
  is_active
) VALUES (
  'marketing_image_generation',
  'Marketing Image Generation',
  'Generate AI-powered marketing images using specialized models',
  'content_generation',
  1,
  true
);

-- Add plan-specific limits for marketing image generation
INSERT INTO public.plan_features (
  plan_type,
  feature_name,
  feature_limit,
  is_enabled
) VALUES 
  ('starter', 'marketing_image_generation', 10, true),
  ('pro', 'marketing_image_generation', 50, true),
  ('growth', 'marketing_image_generation', 200, true),
  ('elite', 'marketing_image_generation', 500, true);