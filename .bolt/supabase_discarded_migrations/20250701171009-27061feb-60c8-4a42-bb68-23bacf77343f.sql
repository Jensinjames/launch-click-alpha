-- Create edge function for team creation with access control
CREATE OR REPLACE FUNCTION public.create_team_with_access_control(
  p_team_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;