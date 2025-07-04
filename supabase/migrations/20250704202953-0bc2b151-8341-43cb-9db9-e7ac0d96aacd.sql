-- Fix bulk_feature_access_check function to remove INSERT operation in read-only transaction
CREATE OR REPLACE FUNCTION public.bulk_feature_access_check(feature_names text[], check_user_id uuid DEFAULT auth.uid())
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
  
  -- Removed problematic logging that caused INSERT in read-only transaction
  -- Bulk access checks happen frequently and don't need individual audit logging
  
  RETURN result;
END;
$function$;