export interface TeamTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: Record<string, any>;
  category: string;
  is_public: boolean;
  created_by: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  id: string;
  team_id: string;
  settings: {
    notifications?: {
      email: boolean;
      in_app: boolean;
      digest: 'daily' | 'weekly' | 'monthly';
    };
    permissions?: {
      default_role: 'viewer' | 'editor' | 'admin';
      require_approval: boolean;
    };
    integrations?: {
      slack?: { webhook_url: string; enabled: boolean };
      discord?: { webhook_url: string; enabled: boolean };
    };
  };
  created_at: string;
  updated_at: string;
}

export interface TeamNotification {
  id: string;
  team_id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  data: any; // Use any for compatibility with Json type
  read_at?: string;
  created_at: string;
}

export interface TeamAnalytics {
  team_id: string;
  total_members: number;
  active_members: number;
  content_generated: number;
  credits_used: number;
  credits_available: number;
  activity_score: number;
  period_start: string;
  period_end: string;
}

export interface TeamWorkflowEvent {
  type: 'team_created' | 'member_invited' | 'member_joined' | 'member_removed' | 'settings_updated';
  team_id: string;
  user_id?: string;
  data: Record<string, any>;
  timestamp: string;
}