-- Create content templates system using existing content_type enum
-- This fixes the error by using the existing content_type enum instead of creating a new one

-- 1. Create asset_type enum (this is new)
CREATE TYPE public.asset_type AS ENUM (
  'text',
  'image', 
  'code',
  'logic',
  'other'
);

-- 2. Create content templates table using existing content_type enum
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type content_type NOT NULL, -- Uses existing enum
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  min_plan_type plan_type NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create template assets table for rich content
CREATE TABLE IF NOT EXISTS public.template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.content_templates(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  asset_data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on both tables
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for content_templates
CREATE POLICY "Users can view accessible templates" ON public.content_templates
  FOR SELECT 
  USING (
    (is_public = true AND can_access_template(min_plan_type, auth.uid())) 
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create own templates" ON public.content_templates
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON public.content_templates
  FOR UPDATE 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON public.content_templates
  FOR DELETE 
  USING (created_by = auth.uid());

-- 6. Create RLS policies for template_assets
CREATE POLICY "Users can view accessible template assets" ON public.template_assets
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.content_templates t
      WHERE t.id = template_assets.template_id
        AND (
          (t.is_public = true AND can_access_template(t.min_plan_type, auth.uid()))
          OR t.created_by = auth.uid()
        )
    )
  );

CREATE POLICY "Users can manage own template assets" ON public.template_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.content_templates t
      WHERE t.id = template_assets.template_id
        AND t.created_by = auth.uid()
    )
  );

-- 7. Create indexes for performance
CREATE INDEX idx_content_templates_type ON public.content_templates(type);
CREATE INDEX idx_content_templates_public ON public.content_templates(is_public);
CREATE INDEX idx_content_templates_created_by ON public.content_templates(created_by);
CREATE INDEX idx_template_assets_template_id ON public.template_assets(template_id);
CREATE INDEX idx_template_assets_position ON public.template_assets(template_id, position);

-- 8. Create trigger for updated_at
CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_assets_updated_at
  BEFORE UPDATE ON public.template_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();