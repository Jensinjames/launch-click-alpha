-- Add missing RLS policies for enhanced security

-- 1. Add comprehensive admin access policies for user_plans table
CREATE POLICY "Super admins can manage all user plans" 
ON public.user_plans 
FOR ALL 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 2. Add team-context policies for generated_content access
CREATE POLICY "Team members can view team content" 
ON public.generated_content 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = generated_content.team_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  ))
);

-- 3. Add proper profile visibility controls
CREATE POLICY "Team members can view team member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (id = auth.uid()) OR 
  is_admin_or_super(auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM team_members tm1 
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id 
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = profiles.id 
    AND tm1.status = 'active' 
    AND tm2.status = 'active'
  ))
);

-- 4. Add enhanced admin session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session_enhanced(require_recent_auth boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role user_role;
  last_sign_in timestamp with time zone;
BEGIN
  -- Get user role and last sign in time
  SELECT p.role, u.last_sign_in_at 
  INTO user_role, last_sign_in
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = auth.uid();
  
  -- Check if user has admin role
  IF user_role NOT IN ('admin', 'super_admin') THEN
    PERFORM log_security_event(
      'unauthorized_admin_access',
      jsonb_build_object('attempted_role', COALESCE(user_role::text, 'null'))
    );
    RETURN false;
  END IF;
  
  -- For sensitive operations, require recent authentication (within 30 minutes)
  IF require_recent_auth THEN
    IF last_sign_in IS NULL OR (now() - last_sign_in > interval '30 minutes') THEN
      PERFORM log_security_event(
        'admin_session_expired',
        jsonb_build_object(
          'role', user_role,
          'last_sign_in', last_sign_in,
          'require_recent_auth', require_recent_auth
        )
      );
      RETURN false;
    END IF;
  END IF;
  
  -- Log successful admin access
  PERFORM log_security_event(
    'admin_access_granted',
    jsonb_build_object(
      'role', user_role,
      'require_recent_auth', require_recent_auth
    )
  );
  
  RETURN true;
END;
$$;

-- 5. Add session timeout tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true,
  user_agent text,
  ip_address inet
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies for user_sessions
CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (is_admin_or_super(auth.uid()));

-- 6. Add function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at <= now() AND is_active = true;
  
  -- Log cleanup activity
  PERFORM log_security_event(
    'session_cleanup',
    jsonb_build_object('cleaned_sessions', ROW_COUNT)
  );
END;
$$;

-- 7. Add enhanced security event logging with rate limiting
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  event_type text, 
  event_data jsonb DEFAULT '{}',
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_events integer;
BEGIN
  -- Rate limiting: Check for similar events in the last minute
  SELECT COUNT(*) INTO recent_events
  FROM audit_logs
  WHERE user_id = user_id_param
    AND action = 'security_event'
    AND table_name = event_type
    AND created_at > (now() - interval '1 minute');
  
  -- Only log if not exceeding rate limit (max 10 similar events per minute)
  IF recent_events < 10 THEN
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
      event_data || jsonb_build_object(
        'timestamp', now(),
        'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
        'rate_limit_count', recent_events
      ),
      now()
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Silently handle errors to prevent disrupting flows
    NULL;
END;
$$;