-- Security Fix: Add explicit search_path to functions to prevent schema injection attacks

-- Fix 1: can_access_feature (SECURITY DEFINER - Critical Priority)
CREATE OR REPLACE FUNCTION public.can_access_feature(
  feature_name text,
  check_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_plan_level INTEGER;
  feature_min_level INTEGER;
  is_authenticated BOOLEAN;
BEGIN
  -- Check if user is authenticated
  is_authenticated := check_user_id IS NOT NULL;
  
  -- If not authenticated, deny all access
  IF NOT is_authenticated THEN
    RETURN FALSE;
  END IF;
  
  -- Get feature minimum level requirement
  SELECT min_plan_level INTO feature_min_level
  FROM public.feature_hierarchy
  WHERE feature_hierarchy.feature_name = can_access_feature.feature_name
    AND is_active = true;
    
  -- If feature not found, deny access (fail secure)
  IF feature_min_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If feature requires no plan (level 0), allow all authenticated users
  IF feature_min_level = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Get user's plan level
  SELECT 
    CASE up.plan_type
      WHEN 'starter' THEN 1
      WHEN 'pro' THEN 2  
      WHEN 'growth' THEN 3
      WHEN 'elite' THEN 4
      ELSE 0
    END INTO user_plan_level
  FROM public.user_plans up
  WHERE up.user_id = check_user_id;
  
  -- If no plan found, treat as level 0 (authenticated but no plan)
  user_plan_level := COALESCE(user_plan_level, 0);
  
  -- Check if user's plan level meets feature requirement
  RETURN user_plan_level >= feature_min_level;
END;
$function$;

-- Fix 2: update_updated_at_column (SECURITY DEFINER - High Priority)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix 3: generate_category_path (Regular Function)
CREATE OR REPLACE FUNCTION public.generate_category_path(content_type content_type)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE content_type
    WHEN 'email_sequence' THEN 'email-campaigns'
    WHEN 'social_post' THEN 'social-media'
    WHEN 'landing_page' THEN 'landing-pages'
    WHEN 'blog_post' THEN 'blog-posts'
    WHEN 'ad_copy' THEN 'ad-copy'
    WHEN 'funnel' THEN 'sales-funnels'
    WHEN 'strategy_brief' THEN 'strategy-briefs'
    ELSE 'general'
  END;
END;
$function$;

-- Fix 4: get_category_info (Regular Function)
CREATE OR REPLACE FUNCTION public.get_category_info(content_type content_type)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE content_type
    WHEN 'email_sequence' THEN jsonb_build_object(
      'title', 'Email Campaigns',
      'description', 'Manage your email marketing campaigns',
      'icon', 'Mail',
      'cta', 'Create Email Campaign'
    )
    WHEN 'social_post' THEN jsonb_build_object(
      'title', 'Social Media Posts',
      'description', 'Create and manage social media content',
      'icon', 'Share2',
      'cta', 'Create Social Post'
    )
    WHEN 'landing_page' THEN jsonb_build_object(
      'title', 'Landing Pages',
      'description', 'Design high-converting landing pages',
      'icon', 'FileText',
      'cta', 'Create Landing Page'
    )
    WHEN 'blog_post' THEN jsonb_build_object(
      'title', 'Blog Posts',
      'description', 'Write engaging blog content',
      'icon', 'FileText',
      'cta', 'Create Blog Post'
    )
    WHEN 'ad_copy' THEN jsonb_build_object(
      'title', 'Ad Copy',
      'description', 'Create compelling advertising copy',
      'icon', 'FileText',
      'cta', 'Create Ad Copy'
    )
    WHEN 'funnel' THEN jsonb_build_object(
      'title', 'Sales Funnels',
      'description', 'Build comprehensive sales funnels',
      'icon', 'FileText',
      'cta', 'Create Sales Funnel'
    )
    WHEN 'strategy_brief' THEN jsonb_build_object(
      'title', 'Strategy Briefs',
      'description', 'Develop strategic marketing plans',
      'icon', 'FileText',
      'cta', 'Create Strategy Brief'
    )
    ELSE jsonb_build_object(
      'title', 'All Content',
      'description', 'Manage and organize all your generated content',
      'icon', 'FileText',
      'cta', 'Generate Content'
    )
  END;
END;
$function$;