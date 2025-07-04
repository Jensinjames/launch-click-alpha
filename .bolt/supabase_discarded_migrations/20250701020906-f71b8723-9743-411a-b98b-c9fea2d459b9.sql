
-- Security Fix: Add explicit search_path to all database functions
-- This prevents SQL injection through search path manipulation

-- Fix validate_admin_session function
CREATE OR REPLACE FUNCTION public.validate_admin_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Log admin access attempt
  IF user_role IN ('admin', 'super_admin') THEN
    PERFORM log_security_event(
      'admin_access',
      jsonb_build_object('role', user_role)
    );
    RETURN true;
  ELSE
    PERFORM log_security_event(
      'unauthorized_admin_access',
      jsonb_build_object('attempted_role', COALESCE(user_role::text, 'null'))
    );
    RETURN false;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- On error, deny access (fail closed for security)
    RETURN false;
END;
$$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    new_values,
    created_at
  ) VALUES (
    user_id_param,
    'security_event',
    event_type,
    event_data,
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently handle errors to prevent disrupting authentication flows
    NULL;
END;
$$;

-- Fix enhanced_password_validation function
CREATE OR REPLACE FUNCTION public.enhanced_password_validation(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Password must be at least 12 characters long
  IF length(password) < 12 THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF NOT (password ~ '[A-Z]') THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one lowercase letter
  IF NOT (password ~ '[a-z]') THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one number
  IF NOT (password ~ '[0-9]') THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one special character
  IF NOT (password ~ '[^A-Za-z0-9]') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer := 0;
BEGIN
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM audit_logs
  WHERE new_values->>'identifier' = identifier
    AND action = 'security_event'
    AND table_name = 'rate_limit_check'
    AND created_at > now() - (time_window_minutes || ' minutes')::interval;
  
  -- Log this attempt
  PERFORM log_security_event(
    'rate_limit_check',
    jsonb_build_object('identifier', identifier, 'attempt_count', attempt_count + 1)
  );
  
  -- Return false if rate limit exceeded
  RETURN attempt_count < max_attempts;
EXCEPTION
  WHEN OTHERS THEN
    -- On error, allow the action (fail open for availability)
    RETURN true;
END;
$$;

-- Fix is_super_admin_user function
CREATE OR REPLACE FUNCTION public.is_super_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(user_id, auth.uid())
    AND role = 'super_admin'
  );
$$;

-- Fix is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' 
     FROM profiles 
     WHERE id = COALESCE(user_id, auth.uid())), 
    false
  );
$$;

-- Fix is_team_owner_direct function
CREATE OR REPLACE FUNCTION public.is_team_owner_direct(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_uuid 
    AND teams.owner_id = user_uuid
  );
$$;

-- Fix is_admin_or_super function
CREATE OR REPLACE FUNCTION public.is_admin_or_super(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') 
     FROM profiles 
     WHERE id = COALESCE(user_id, auth.uid())), 
    false
  );
$$;

-- Fix is_team_member_direct function
CREATE OR REPLACE FUNCTION public.is_team_member_direct(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.team_id = team_uuid 
    AND team_members.user_id = user_uuid 
    AND team_members.status = 'active'
  );
$$;

-- Fix test_team_members_rls_fix function
CREATE OR REPLACE FUNCTION public.test_team_members_rls_fix()
RETURNS TABLE(test_name text, status text, details text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  test_user_id uuid;
  test_team_id uuid;
  member_count integer;
  can_see_members boolean;
  has_plan boolean;
  is_owner boolean;
BEGIN
  -- Test 1: Verify helper functions work
  RETURN QUERY SELECT 
    'Helper Functions Test'::text,
    'CHECKING'::text,
    'Testing SECURITY DEFINER functions'::text;

  BEGIN
    -- Create test data
    test_user_id := gen_random_uuid();
    test_team_id := gen_random_uuid();
    
    -- Test is_team_owner_direct function
    SELECT is_team_owner_direct(test_team_id, test_user_id) INTO is_owner;
    
    RETURN QUERY SELECT 
      'is_team_owner_direct'::text,
      CASE WHEN is_owner IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::text,
      'Function executed without recursion'::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'is_team_owner_direct'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 2: Verify has_team_plan function
  BEGIN
    SELECT has_team_plan(test_user_id) INTO has_plan;
    
    RETURN QUERY SELECT 
      'has_team_plan'::text,
      CASE WHEN has_plan IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::text,
      'Function executed without recursion'::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'has_team_plan'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 3: Verify team_members table can be queried without recursion
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM team_members 
    WHERE team_id = test_team_id;
    
    RETURN QUERY SELECT 
      'team_members_query'::text,
      'PASS'::text,
      ('Successfully queried team_members table, count: ' || member_count::text)::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'team_members_query'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 4: Verify policies exist
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'team_members'
    AND policyname LIKE 'team_members_%';
    
    RETURN QUERY SELECT 
      'policies_exist'::text,
      CASE WHEN member_count >= 5 THEN 'PASS' ELSE 'FAIL' END::text,
      ('Found ' || member_count::text || ' team_members policies')::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'policies_exist'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  RETURN QUERY SELECT 
    'Overall Test'::text,
    'COMPLETE'::text,
    'RLS fix verification completed'::text;
END;
$$;

-- Fix get_team_member_count function
CREATE OR REPLACE FUNCTION public.get_team_member_count(team_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer 
  FROM team_members 
  WHERE team_id = team_uuid 
  AND status = 'active';
$$;

-- Fix has_team_plan function
CREATE OR REPLACE FUNCTION public.has_team_plan(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plans 
    WHERE user_plans.user_id = user_uuid 
    AND user_plans.plan_type = ANY (ARRAY['growth'::plan_type, 'elite'::plan_type])
  );
$$;

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(user_id, auth.uid())
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Fix can_access_template function
CREATE OR REPLACE FUNCTION public.can_access_template(template_plan_type plan_type, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN template_plan_type = 'starter' THEN true
    WHEN template_plan_type = 'pro' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type IN ('pro', 'growth', 'elite')
      )
    WHEN template_plan_type = 'growth' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type IN ('growth', 'elite')
      )
    WHEN template_plan_type = 'elite' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type = 'elite'
      )
    ELSE false
  END;
$$;

-- Fix get_user_team_seats function
CREATE OR REPLACE FUNCTION public.get_user_team_seats(user_uuid uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(user_plans.team_seats, 1)
  FROM user_plans 
  WHERE user_plans.user_id = user_uuid;
$$;

-- Add security comments
COMMENT ON FUNCTION public.validate_admin_session() IS 'Validates admin access with secure search path - prevents SQL injection';
COMMENT ON FUNCTION public.log_security_event(text, jsonb, uuid) IS 'Logs security events with secure search path - prevents SQL injection';
COMMENT ON FUNCTION public.enhanced_password_validation(text) IS 'Enhanced password validation with secure search path - prevents SQL injection';
COMMENT ON FUNCTION public.check_rate_limit(text, integer, integer) IS 'Rate limiting with secure search path - prevents SQL injection';
