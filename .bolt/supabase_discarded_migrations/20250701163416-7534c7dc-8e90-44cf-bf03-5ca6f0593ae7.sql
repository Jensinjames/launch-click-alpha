-- Create email delivery tracking table
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES public.team_invitations(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
  provider_response JSONB DEFAULT '{}',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_invitation_id ON public.email_delivery_logs(invitation_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status_created ON public.email_delivery_logs(status, created_at);

-- Enable RLS
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all email logs" ON public.email_delivery_logs
  FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()));

CREATE POLICY "System can insert email logs" ON public.email_delivery_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update email logs" ON public.email_delivery_logs
  FOR UPDATE TO authenticated
  USING (true);