-- Create storage buckets for the filing system
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('template-assets', 'template-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']),
  ('generated-images', 'generated-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('user-uploads', 'user-uploads', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('content-exports', 'content-exports', false, 104857600, ARRAY['application/pdf', 'text/html', 'application/zip', 'text/plain']);

-- Create storage policies for template-assets bucket
CREATE POLICY "Users can view public template assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'template-assets');

CREATE POLICY "Users can upload to their template assets folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'template-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their template assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'template-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their template assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'template-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for generated-images bucket
CREATE POLICY "Users can view public generated images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Users can upload their generated images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their generated images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'generated-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their generated images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for user-uploads bucket
CREATE POLICY "Users can view their uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload to their folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for content-exports bucket
CREATE POLICY "Users can view their exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'content-exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their exports" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'content-exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content-exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update content_templates table to support enhanced schema system
ALTER TABLE content_templates 
ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS asset_references JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS output_format TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS validation_schema JSONB DEFAULT '{}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_content_templates_output_format ON content_templates(output_format);
CREATE INDEX IF NOT EXISTS idx_content_templates_schema_version ON content_templates(schema_version);