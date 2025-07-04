
-- Security Enhancement Phase 1: Critical RLS Policy Fixes and Database Security (Fixed)

-- Create or replace security functions first
CREATE OR REPLACE FUNCTION enhanced_password_validation(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create security event logging function
CREATE OR REPLACE FUNCTION log_security_event(
  event_type text,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create session security function
CREATE OR REPLACE FUNCTION validate_admin_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add missing admin policies that might not exist
DO $$
BEGIN
  -- Try to create admin policies for user_plans
  BEGIN
    CREATE POLICY "Admins can manage all plans"
      ON user_plans
      FOR ALL
      TO authenticated
      USING (is_super_admin(auth.uid()))
      WITH CHECK (is_super_admin(auth.uid()));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- Try to create admin policies for user_credits
  BEGIN
    CREATE POLICY "Admins can manage all credits"
      ON user_credits
      FOR ALL
      TO authenticated
      USING (is_super_admin(auth.uid()))
      WITH CHECK (is_super_admin(auth.uid()));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- Try to create admin policies for generated_content
  BEGIN
    CREATE POLICY "Admins can manage all content"
      ON generated_content
      FOR ALL
      TO authenticated
      USING (is_super_admin(auth.uid()))
      WITH CHECK (is_super_admin(auth.uid()));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- Fix audit logs policies
  BEGIN
    DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
    CREATE POLICY "Super admins can view audit logs"
      ON audit_logs
      FOR SELECT
      TO authenticated
      USING (is_super_admin(auth.uid()));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "System can insert audit logs"
      ON audit_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Add indexes for better security query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events 
  ON audit_logs (action, table_name, created_at) 
  WHERE action = 'security_event';

CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles (role) 
  WHERE role IN ('admin', 'super_admin');

CREATE INDEX IF NOT EXISTS idx_audit_logs_rate_limit
  ON audit_logs (table_name, created_at, (new_values->>'identifier'))
  WHERE action = 'security_event' AND table_name = 'rate_limit_check';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION enhanced_password_validation(text) TO authenticated, public;
GRANT EXECUTE ON FUNCTION log_security_event(text, jsonb, uuid) TO authenticated, public;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, integer, integer) TO authenticated, public;
GRANT EXECUTE ON FUNCTION validate_admin_session() TO authenticated, public;

-- Add helpful comments
COMMENT ON FUNCTION enhanced_password_validation(text) IS 'Validates password meets enhanced security requirements: 12+ chars, uppercase, lowercase, number, special char';
COMMENT ON FUNCTION log_security_event(text, jsonb, uuid) IS 'Logs security events to audit_logs table for monitoring and fails gracefully';
COMMENT ON FUNCTION check_rate_limit(text, integer, integer) IS 'Implements server-side rate limiting with configurable limits and graceful failure handling';
COMMENT ON FUNCTION validate_admin_session() IS 'Validates admin access, logs all attempts, and fails closed on errors';
