-- Fix security warnings: Add proper search_path to functions

-- Update get_feature_usage_with_limits function
CREATE OR REPLACE FUNCTION public.get_feature_usage_with_limits(p_user_id uuid, p_feature_name text)
 RETURNS TABLE(usage_count integer, feature_limit integer, remaining integer, period_start timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Update reset_monthly_feature_usage function
CREATE OR REPLACE FUNCTION public.reset_monthly_feature_usage()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Archive old usage data and reset for new month
  UPDATE public.feature_usage_tracking 
  SET 
    usage_count = 0,
    period_start = date_trunc('month', now()),
    updated_at = now()
  WHERE period_start < date_trunc('month', now());
END;
$function$;

-- Update log_invitation_activity function
CREATE OR REPLACE FUNCTION public.log_invitation_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'invitation_sent',
      jsonb_build_object(
        'email', NEW.email,
        'role', NEW.role,
        'invited_by', NEW.invited_by
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'invitation_status_changed',
      jsonb_build_object(
        'email', NEW.email,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Address billing foreign table security issue by removing it from API access
-- The billing table appears to be a foreign table that doesn't need API access
-- We'll revoke access from the authenticator and anon roles
REVOKE ALL ON public.billing FROM authenticator;
REVOKE ALL ON public.billing FROM anon;
REVOKE ALL ON public.billing FROM authenticated;