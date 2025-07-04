-- Create feature usage tracking table for quota management
CREATE TABLE IF NOT EXISTS public.feature_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique tracking per user, feature, and period
  UNIQUE(user_id, feature_name, period_start)
);

-- Add RLS policies for feature usage tracking
ALTER TABLE public.feature_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own usage data
CREATE POLICY "Users can view own feature usage" 
ON public.feature_usage_tracking 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feature usage" 
ON public.feature_usage_tracking 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own feature usage" 
ON public.feature_usage_tracking 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Admins can manage all usage data
CREATE POLICY "Admins can manage all feature usage" 
ON public.feature_usage_tracking 
FOR ALL 
USING (is_admin_or_super(auth.uid())) 
WITH CHECK (is_admin_or_super(auth.uid()));