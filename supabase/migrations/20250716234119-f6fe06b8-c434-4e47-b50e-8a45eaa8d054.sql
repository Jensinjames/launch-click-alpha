-- Add content_export_pdf feature to feature_hierarchy if not exists
INSERT INTO public.feature_hierarchy (
  feature_name,
  display_name,
  description,
  category,
  min_plan_level,
  is_active
) VALUES (
  'content_export_pdf',
  'PDF Export',
  'Export individual content items as PDF files',
  'export',
  1,
  true
) ON CONFLICT (feature_name) DO UPDATE SET
  min_plan_level = 1,
  is_active = true,
  description = 'Export individual content items as PDF files';