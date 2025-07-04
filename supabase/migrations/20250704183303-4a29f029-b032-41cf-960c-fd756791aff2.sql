-- Create bulk feature access function to reduce RPC calls from 9 to 1
CREATE OR REPLACE FUNCTION public.bulk_feature_access_check(
  feature_names text[],
  check_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}';
  feature_name text;
  has_access boolean;
BEGIN
  -- Validate input
  IF feature_names IS NULL OR array_length(feature_names, 1) IS NULL THEN
    RETURN result;
  END IF;
  
  -- Check each feature and build result object
  FOREACH feature_name IN ARRAY feature_names
  LOOP
    -- Use existing can_access_with_contract function for consistency
    SELECT public.can_access_with_contract(feature_name, check_user_id) INTO has_access;
    result := jsonb_set(result, ARRAY[feature_name], to_jsonb(COALESCE(has_access, false)));
  END LOOP;
  
  -- Log bulk access check for monitoring
  PERFORM public.log_feature_access(
    'bulk_check',
    true,
    check_user_id,
    jsonb_build_object(
      'features_checked', array_length(feature_names, 1),
      'feature_names', feature_names
    )
  );
  
  RETURN result;
END;
$function$;