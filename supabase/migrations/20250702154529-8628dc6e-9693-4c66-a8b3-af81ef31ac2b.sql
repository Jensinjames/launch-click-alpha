-- Team Management Enhancement Tables

-- Team settings for configuration
CREATE TABLE public.team_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team templates for quick setup
CREATE TABLE public.team_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team notifications for activity tracking
CREATE TABLE public.team_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_settings
CREATE POLICY "Team members can view team settings" 
ON public.team_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.team_members 
  WHERE team_id = team_settings.team_id 
  AND user_id = auth.uid() 
  AND status = 'active'
));

CREATE POLICY "Team admins can manage team settings" 
ON public.team_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.team_members 
  WHERE team_id = team_settings.team_id 
  AND user_id = auth.uid() 
  AND role IN ('owner', 'admin')
));

-- RLS Policies for team_templates
CREATE POLICY "Users can view accessible templates" 
ON public.team_templates 
FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create own templates" 
ON public.team_templates 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" 
ON public.team_templates 
FOR UPDATE 
USING (created_by = auth.uid());

-- RLS Policies for team_notifications
CREATE POLICY "Team members can view team notifications" 
ON public.team_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.team_members 
  WHERE team_id = team_notifications.team_id 
  AND user_id = auth.uid()
) OR user_id = auth.uid());

CREATE POLICY "Team admins can manage notifications" 
ON public.team_notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.team_members 
  WHERE team_id = team_notifications.team_id 
  AND user_id = auth.uid() 
  AND role IN ('owner', 'admin')
));

-- Indexes for performance
CREATE INDEX idx_team_settings_team_id ON public.team_settings(team_id);
CREATE INDEX idx_team_templates_category ON public.team_templates(category);
CREATE INDEX idx_team_templates_public ON public.team_templates(is_public);
CREATE INDEX idx_team_notifications_team_id ON public.team_notifications(team_id);
CREATE INDEX idx_team_notifications_user_id ON public.team_notifications(user_id);
CREATE INDEX idx_team_notifications_read_at ON public.team_notifications(read_at);

-- Triggers for updated_at
CREATE TRIGGER update_team_settings_updated_at
BEFORE UPDATE ON public.team_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_templates_updated_at
BEFORE UPDATE ON public.team_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();