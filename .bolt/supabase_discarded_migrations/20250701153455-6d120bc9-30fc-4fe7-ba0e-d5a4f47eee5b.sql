-- Create invitation status enum if not exists
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create team invitations table if not exists
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT generate_invitation_token(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team invitations
DROP POLICY IF EXISTS "Team admins can manage invitations" ON public.team_invitations;
CREATE POLICY "Team admins can manage invitations"
  ON public.team_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.team_invitations;
CREATE POLICY "Users can view invitations sent to their email"
  ON public.team_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- Create audit logging for invitations
CREATE OR REPLACE FUNCTION log_invitation_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'invitation_sent',
      jsonb_build_object(
        'email', NEW.email,
        'role', NEW.role,
        'invited_by', NEW.invited_by
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'invitation_status_changed',
      jsonb_build_object(
        'email', NEW.email,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS invitation_activity_trigger ON public.team_invitations;
CREATE TRIGGER invitation_activity_trigger
  AFTER INSERT OR UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION log_invitation_activity();