-- Create content_assemblies table for tracking combined content
CREATE TABLE public.content_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assembly_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'template', 'automated'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_dependencies table for relationship mapping
CREATE TABLE public.content_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.content_assemblies(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  dependency_order INTEGER NOT NULL DEFAULT 0,
  dependency_type TEXT NOT NULL DEFAULT 'component', -- 'component', 'prerequisite', 'reference'
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assembly_id, content_id, dependency_type)
);

-- Enable Row Level Security
ALTER TABLE public.content_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_assemblies
CREATE POLICY "Users can manage own assemblies" 
ON public.content_assemblies 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for content_dependencies
CREATE POLICY "Users can manage dependencies for own assemblies" 
ON public.content_dependencies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.content_assemblies ca 
    WHERE ca.id = content_dependencies.assembly_id 
    AND ca.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_assemblies ca 
    WHERE ca.id = content_dependencies.assembly_id 
    AND ca.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_content_assemblies_user_id ON public.content_assemblies(user_id);
CREATE INDEX idx_content_assemblies_status ON public.content_assemblies(status);
CREATE INDEX idx_content_dependencies_assembly_id ON public.content_dependencies(assembly_id);
CREATE INDEX idx_content_dependencies_content_id ON public.content_dependencies(content_id);

-- Add trigger for updated_at
CREATE TRIGGER update_content_assemblies_updated_at
BEFORE UPDATE ON public.content_assemblies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get assembly with dependencies
CREATE OR REPLACE FUNCTION public.get_assembly_with_content(assembly_uuid uuid)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'assembly', json_build_object(
      'id', ca.id,
      'title', ca.title,
      'description', ca.description,
      'assembly_type', ca.assembly_type,
      'status', ca.status,
      'metadata', ca.metadata,
      'created_at', ca.created_at,
      'updated_at', ca.updated_at
    ),
    'content', json_agg(
      json_build_object(
        'dependency_id', cd.id,
        'dependency_order', cd.dependency_order,
        'dependency_type', cd.dependency_type,
        'settings', cd.settings,
        'content', json_build_object(
          'id', gc.id,
          'title', gc.title,
          'type', gc.type,
          'content', gc.content,
          'created_at', gc.created_at
        )
      ) ORDER BY cd.dependency_order
    )
  ) INTO result
  FROM public.content_assemblies ca
  LEFT JOIN public.content_dependencies cd ON cd.assembly_id = ca.id
  LEFT JOIN public.generated_content gc ON gc.id = cd.content_id
  WHERE ca.id = assembly_uuid
    AND ca.user_id = auth.uid()
  GROUP BY ca.id, ca.title, ca.description, ca.assembly_type, ca.status, ca.metadata, ca.created_at, ca.updated_at;
  
  RETURN result;
END;
$function$;