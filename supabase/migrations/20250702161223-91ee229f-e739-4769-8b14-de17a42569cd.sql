-- Comprehensive RLS Performance and Team Functionality Fixes

-- 1. Fix RLS policies for profiles table (performance improvement)
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = (SELECT auth.uid()));

-- 2. Fix RLS policies for user_plans table
DROP POLICY IF EXISTS "Users can update own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON public.user_plans;

CREATE POLICY "Users can update own plan" ON public.user_plans
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own plan" ON public.user_plans
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 3. Fix RLS policies for user_credits table
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;

CREATE POLICY "Users can view own credits" ON public.user_credits
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 4. Fix RLS policies for generated_content table
DROP POLICY IF EXISTS "Users can delete own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can insert own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can update own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can view own content" ON public.generated_content;

CREATE POLICY "Users can delete own content" ON public.generated_content
FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own content" ON public.generated_content
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own content" ON public.generated_content
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own content" ON public.generated_content
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 5. Fix RLS policies for teams table
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

CREATE POLICY "Team owners can delete teams" ON public.teams
FOR DELETE USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Team owners can update teams" ON public.teams
FOR UPDATE USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can create teams" ON public.teams
FOR INSERT WITH CHECK (
  owner_id = (SELECT auth.uid()) AND
  EXISTS (
    SELECT 1 FROM user_plans 
    WHERE user_id = (SELECT auth.uid()) 
    AND plan_type IN ('growth', 'elite')
  )
);

CREATE POLICY "Users can view teams they belong to" ON public.teams
FOR SELECT USING (
  owner_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = teams.id 
    AND user_id = (SELECT auth.uid())
    AND status = 'active'
  )
);

-- 6. Add missing RLS policies for team_settings table
DROP POLICY IF EXISTS "Team admins can manage team settings" ON public.team_settings;
DROP POLICY IF EXISTS "Team members can view team settings" ON public.team_settings;

CREATE POLICY "Team admins can manage team settings" ON public.team_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_settings.team_id 
    AND user_id = (SELECT auth.uid()) 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "Team members can view team settings" ON public.team_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_settings.team_id 
    AND user_id = (SELECT auth.uid())
    AND status = 'active'
  )
);

-- 7. Add missing RLS policies for team_templates table
DROP POLICY IF EXISTS "Users can create own templates" ON public.team_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.team_templates;
DROP POLICY IF EXISTS "Users can view accessible templates" ON public.team_templates;

CREATE POLICY "Users can create own templates" ON public.team_templates
FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can update own templates" ON public.team_templates
FOR UPDATE USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can view accessible templates" ON public.team_templates
FOR SELECT USING (
  is_public = true OR 
  created_by = (SELECT auth.uid())
);

-- 8. Add missing RLS policies for team_notifications table
DROP POLICY IF EXISTS "Team admins can manage notifications" ON public.team_notifications;
DROP POLICY IF EXISTS "Team members can view team notifications" ON public.team_notifications;

CREATE POLICY "Team admins can manage notifications" ON public.team_notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_notifications.team_id 
    AND user_id = (SELECT auth.uid()) 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "Team members can view team notifications" ON public.team_notifications
FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_notifications.team_id 
    AND user_id = (SELECT auth.uid())
    AND status = 'active'
  )
);

-- 9. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON public.team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_status ON public.team_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_plan ON public.user_plans(user_id, plan_type);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_email ON public.team_invitations(team_id, email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_status ON public.team_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_team_settings_team ON public.team_settings(team_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_team_user ON public.team_notifications(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_user_read ON public.team_notifications(user_id, read_at);

-- 10. Update team creation function to handle better error messages
CREATE OR REPLACE FUNCTION public.create_team_with_access_control(p_team_name text, p_description text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_plan RECORD;
  v_team_count INTEGER;
  v_max_teams INTEGER;
  v_new_team_id UUID;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get user's plan information
  SELECT plan_type, team_seats INTO v_user_plan
  FROM user_plans 
  WHERE user_id = v_user_id;

  -- Check if user has a team plan
  IF v_user_plan.plan_type NOT IN ('growth', 'elite') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Team creation requires Growth or Elite plan',
      'upgrade_required', true
    );
  END IF;

  -- Set team limits based on plan
  v_max_teams := CASE 
    WHEN v_user_plan.plan_type = 'elite' THEN 10
    ELSE 3
  END;

  -- Count current teams owned by user
  SELECT COUNT(*) INTO v_team_count
  FROM teams 
  WHERE owner_id = v_user_id;

  -- Check team limit
  IF v_team_count >= v_max_teams THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Maximum teams reached (%s/%s)', v_team_count, v_max_teams),
      'limit_reached', true
    );
  END IF;

  -- Validate team name
  IF p_team_name IS NULL OR trim(p_team_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team name is required');
  END IF;

  IF length(trim(p_team_name)) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team name must be at least 2 characters');
  END IF;

  IF length(trim(p_team_name)) > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team name must be less than 50 characters');
  END IF;

  -- Create the team
  INSERT INTO teams (name, owner_id)
  VALUES (trim(p_team_name), v_user_id)
  RETURNING id INTO v_new_team_id;

  -- Add owner as team member
  INSERT INTO team_members (team_id, user_id, role, status, joined_at)
  VALUES (v_new_team_id, v_user_id, 'owner', 'active', now());

  -- Log the activity
  PERFORM log_team_activity(
    v_new_team_id,
    'team_created',
    jsonb_build_object(
      'team_name', trim(p_team_name),
      'description', p_description,
      'owner_id', v_user_id
    )
  );

  -- Log security event
  PERFORM log_security_event(
    'team_created',
    jsonb_build_object(
      'team_id', v_new_team_id,
      'team_name', trim(p_team_name),
      'user_plan', v_user_plan.plan_type
    ),
    v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'team_id', v_new_team_id,
    'team_name', trim(p_team_name),
    'teams_used', v_team_count + 1,
    'teams_limit', v_max_teams
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    PERFORM log_security_event(
      'team_creation_failed',
      jsonb_build_object(
        'error', SQLERRM,
        'team_name', p_team_name
      ),
      v_user_id
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create team: ' || SQLERRM
    );
END;
$function$;