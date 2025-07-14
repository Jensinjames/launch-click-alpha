// Settings Types - Centralized Type Definitions
import type { Json } from '@/integrations/supabase/types';
export interface UserSettings {
  fullName: string;
  email: string;
  company: string;
}

export interface NotificationSettings {
  emailUpdates: boolean;
  creditAlerts: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  analyticsSharing: boolean;
  dataExport: boolean;
}

export interface UserPreferences {
  timezone: string;
  theme: string;
  language: string;
  email_notifications: Json;
  default_content_settings: Json;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  company_name: string | null;
  avatar_url: string | null;
  onboarded: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CompleteUserSettings {
  profile: Profile | null;
  preferences: UserPreferences | null;
}