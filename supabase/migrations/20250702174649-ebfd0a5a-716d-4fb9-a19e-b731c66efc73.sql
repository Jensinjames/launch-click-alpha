-- Critical Security Fixes for Admin Role Protection and Plan Management

-- 1. Fix profiles table to prevent self-role escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Replace with more restrictive policies
CREATE POLICY "Users can update own profile (non-role fields)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND 
  -- Prevent role changes in regular profile updates
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Only super admins can change user roles
CREATE POLICY "Super admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 2. Fix user_plans table to prevent unauthorized plan changes
DROP POLICY IF EXISTS "Users can update own plan" ON public.user_plans;

-- Users can only view their plans, not modify them
CREATE POLICY "Users can view own plan only" 
ON public.user_plans 
FOR SELECT 
USING (user_id = auth.uid());

-- Only admins can modify plans
CREATE POLICY "Admins can manage user plans" 
ON public.user_plans 
FOR ALL 
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- 3. Add enhanced role change audit function
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes with enhanced details
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM audit_sensitive_operation(
      'user_role_changed',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'target_user_email', NEW.email,
        'timestamp', now()
      ),
      jsonb_build_object(
        'role', NEW.role,
        'role_changed_at', now(),
        'changed_by', auth.uid()
      )
    );
    
    -- Log security event for monitoring
    PERFORM log_security_event(
      'role_escalation_attempt',
      jsonb_build_object(
        'target_user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'admin_user_id', auth.uid()
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes ON public.profiles;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_change();

-- 4. Add enhanced session invalidation function
CREATE OR REPLACE FUNCTION public.invalidate_user_sessions(target_user_id uuid, reason text DEFAULT 'security_event')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark all user sessions as inactive
  UPDATE public.user_sessions 
  SET is_active = false,
      invalidated_at = now(),
      invalidation_reason = reason
  WHERE user_id = target_user_id AND is_active = true;
  
  -- Log the session invalidation
  PERFORM log_security_event(
    'bulk_session_invalidation',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'reason', reason,
      'invalidated_sessions', ROW_COUNT,
      'admin_user_id', auth.uid()
    ),
    auth.uid()
  );
END;
$$;

-- 5. Add function to validate admin session freshness
CREATE OR REPLACE FUNCTION public.require_fresh_admin_session(max_age_minutes integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role user_role;
  last_sign_in timestamp with time zone;
BEGIN
  -- Get user role and last sign in
  SELECT p.role, u.last_sign_in_at 
  INTO user_role, last_sign_in
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = auth.uid();
  
  -- Check if user has admin role
  IF user_role NOT IN ('admin', 'super_admin') THEN
    PERFORM log_security_event(
      'unauthorized_admin_operation',
      jsonb_build_object('attempted_role', COALESCE(user_role::text, 'null'))
    );
    RETURN false;
  END IF;
  
  -- Check session freshness for sensitive operations
  IF last_sign_in IS NULL OR (now() - last_sign_in > (max_age_minutes || ' minutes')::interval) THEN
    PERFORM log_security_event(
      'stale_admin_session',
      jsonb_build_object(
        'role', user_role,
        'last_sign_in', last_sign_in,
        'max_age_minutes', max_age_minutes
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 6. Add data retention cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up old audit logs (keep 2 years)
  DELETE FROM audit_logs 
  WHERE created_at < now() - interval '2 years';
  
  -- Clean up old inactive sessions (keep 90 days)
  DELETE FROM user_sessions 
  WHERE is_active = false 
    AND created_at < now() - interval '90 days';
  
  -- Log cleanup activity
  PERFORM log_security_event(
    'security_data_cleanup',
    jsonb_build_object(
      'audit_logs_deleted', (SELECT changes()),
      'sessions_deleted', (SELECT changes()),
      'cleanup_date', now()
    )
  );
END;
$$;