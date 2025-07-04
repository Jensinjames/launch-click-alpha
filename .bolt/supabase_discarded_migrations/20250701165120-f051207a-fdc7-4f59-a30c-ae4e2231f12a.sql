-- Create feature usage tracking table for granular quota management
CREATE TABLE IF NOT EXISTS public.feature_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, feature_name, period_start)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature_period 
ON public.feature_usage_tracking(user_id, feature_name, period_start);

CREATE INDEX IF NOT EXISTS idx_feature_usage_last_used 
ON public.feature_usage_tracking(last_used_at);

-- Enable RLS
ALTER TABLE public.feature_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own feature usage" ON public.feature_usage_tracking
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature usage" ON public.feature_usage_tracking
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feature usage" ON public.feature_usage_tracking
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feature usage" ON public.feature_usage_tracking
  FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()));

-- Function to reset monthly usage tracking
CREATE OR REPLACE FUNCTION public.reset_monthly_feature_usage()
RETURNS void AS $$
BEGIN
  -- Archive old usage data and reset for new month
  UPDATE public.feature_usage_tracking 
  SET 
    usage_count = 0,
    period_start = date_trunc('month', now()),
    updated_at = now()
  WHERE period_start < date_trunc('month', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feature usage with limits
CREATE OR REPLACE FUNCTION public.get_feature_usage_with_limits(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS TABLE(
  usage_count INTEGER,
  feature_limit INTEGER,
  remaining INTEGER,
  period_start TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fut.usage_count, 0) as usage_count,
    pf.feature_limit,
    CASE 
      WHEN pf.feature_limit IS NULL THEN NULL
      ELSE GREATEST(0, pf.feature_limit - COALESCE(fut.usage_count, 0))
    END as remaining,
    COALESCE(fut.period_start, date_trunc('month', now())) as period_start
  FROM (
    SELECT up.plan_type
    FROM public.user_plans up
    WHERE up.user_id = p_user_id
    LIMIT 1
  ) user_plan
  LEFT JOIN public.plan_features pf ON pf.plan_type = user_plan.plan_type 
    AND pf.feature_name = p_feature_name
  LEFT JOIN public.feature_usage_tracking fut ON fut.user_id = p_user_id 
    AND fut.feature_name = p_feature_name
    AND fut.period_start = date_trunc('month', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;