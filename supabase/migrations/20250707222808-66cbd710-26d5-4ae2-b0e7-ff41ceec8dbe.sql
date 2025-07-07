-- Create export_jobs table for tracking export operations
CREATE TABLE public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL, -- 'pdf', 'docx', 'zip'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  content_ids UUID[] NOT NULL DEFAULT '{}',
  file_url TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable Row Level Security
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for export_jobs
CREATE POLICY "Users can manage own export jobs" 
ON public.export_jobs 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_export_jobs_user_id ON public.export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX idx_export_jobs_expires_at ON public.export_jobs(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_export_jobs_updated_at
BEFORE UPDATE ON public.export_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add export-related features to feature hierarchy
INSERT INTO public.feature_hierarchy (
  feature_name,
  display_name,
  description,
  category,
  min_plan_level,
  is_active
) VALUES 
(
  'content_export_pdf',
  'PDF Export',
  'Export content as formatted PDF documents',
  'content',
  1,
  true
),
(
  'content_export_bulk',
  'Bulk Export',
  'Export multiple content pieces as ZIP archives',
  'content',
  2,
  true
),
(
  'content_export_docx',
  'Word Export',
  'Export content as Word documents',
  'content',
  2,
  true
) ON CONFLICT (feature_name) DO NOTHING;