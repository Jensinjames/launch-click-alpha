-- Create marketing image generation jobs table
CREATE TABLE public.marketing_image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style TEXT DEFAULT 'none',
  steps INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url TEXT,
  error_message TEXT,
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.marketing_image_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own jobs" ON public.marketing_image_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON public.marketing_image_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update jobs" ON public.marketing_image_jobs
  FOR UPDATE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_marketing_image_jobs_updated_at
  BEFORE UPDATE ON public.marketing_image_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient status polling  
CREATE INDEX idx_marketing_image_jobs_user_status ON public.marketing_image_jobs(user_id, status);
CREATE INDEX idx_marketing_image_jobs_created_at ON public.marketing_image_jobs(created_at);