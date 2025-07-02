-- Emergency fix: Simplify RLS functions to prevent infinite loops

-- Create a simple admin check function that doesn't rely on complex validation
CREATE OR REPLACE FUNCTION public.is_simple_admin(user_id uuid DEFAULT auth.uid())
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

-- Temporarily replace the complex require_fresh_admin_session with a simple version
CREATE OR REPLACE FUNCTION public.require_fresh_admin_session(max_age_minutes integer DEFAULT 30)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_simple_admin(auth.uid());
$$;

-- Simplify validate_admin_session function
CREATE OR REPLACE FUNCTION public.validate_admin_session()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_simple_admin(auth.uid());
$$;

-- Create emergency cleanup function that doesn't log to prevent recursion
CREATE OR REPLACE FUNCTION public.emergency_sign_out()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple session cleanup without complex logging
  UPDATE public.user_sessions 
  SET is_active = false,
      invalidated_at = now(),
      invalidation_reason = 'emergency_logout'
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;