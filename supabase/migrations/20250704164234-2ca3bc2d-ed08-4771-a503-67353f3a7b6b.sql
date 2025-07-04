-- Create RPC function to batch dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_data(user_uuid uuid DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  credits_data RECORD;
  recent_assets JSON;
  result JSON;
BEGIN
  -- Get user credits
  SELECT credits_used, monthly_limit INTO credits_data
  FROM public.user_credits 
  WHERE user_id = user_uuid;
  
  -- Get recent assets (top 5)
  SELECT json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'type', type,
      'created_at', created_at,
      'is_favorite', is_favorite
    )
  ) INTO recent_assets
  FROM (
    SELECT id, title, type, created_at, is_favorite
    FROM public.generated_content 
    WHERE user_id = user_uuid
    ORDER BY created_at DESC 
    LIMIT 5
  ) recent;
  
  -- Build result
  result := json_build_object(
    'credits', json_build_object(
      'used', COALESCE(credits_data.credits_used, 0),
      'limit', COALESCE(credits_data.monthly_limit, 50)
    ),
    'recentAssets', COALESCE(recent_assets, '[]'::json)
  );
  
  RETURN result;
END;
$$;