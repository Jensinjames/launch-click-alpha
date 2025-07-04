// Unified Notification Types - Single Source of Truth

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    teamInvites: boolean;
    memberChanges: boolean;
    teamUpdates: boolean;
    mentions: boolean;
  };
  digest?: 'daily' | 'weekly' | 'monthly';
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

export interface NotificationSettings {
  content_ready: boolean;
  credit_alerts: boolean;
  weekly_summary: boolean;
  team_invitations: boolean;
  collaboration_updates: boolean;
}

export interface NotificationState {
  notifications: TeamNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: string | null;
}