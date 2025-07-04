
import { supabase } from '@/integrations/supabase/client';

export interface UserSettings {
  fullName: string;
  email: string;
  company: string;
  timezone: string;
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

export class SettingsService {
  static async updateProfile(userId: string, settings: UserSettings) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: settings.fullName,
        company_name: settings.company,
        // Note: email updates should go through Supabase auth
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateNotificationPreferences(userId: string, settings: NotificationSettings) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        email_notifications: {
          content_ready: settings.emailUpdates,
          credit_alerts: settings.creditAlerts,
          weekly_summary: settings.weeklyReport,
          team_invitations: true, // Always keep team invitations on
          collaboration_updates: true, // Always keep collaboration updates on
          marketing: settings.marketingEmails
        }
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updatePrivacySettings(userId: string, settings: PrivacySettings) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        // Store privacy settings in a structured way
        default_content_settings: {
          profile_visible: settings.profileVisible,
          analytics_sharing: settings.analyticsSharing,
          data_export_enabled: settings.dataExport
        }
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async deleteUserAccount(userId: string) {
    // This would trigger a cascade delete due to foreign key constraints
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    // Also sign out the current user
    await supabase.auth.signOut();
  }

  static async getUserSettings(userId: string) {
    const [profileResult, preferencesResult] = await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('user_preferences').select('*').maybeSingle()
    ]);

    // Create default user_preferences if it doesn't exist
    let preferences = preferencesResult.data;
    if (!preferences && !preferencesResult.error) {
      const { data: newPreferences, error: createError } = await supabase
        .from('user_preferences')
        .insert({ user_id: userId })
        .select()
        .maybeSingle();
      
      if (!createError) {
        preferences = newPreferences;
      }
    }

    return {
      profile: profileResult.data,
      preferences,
      profileError: profileResult.error,
      preferencesError: preferencesResult.error
    };
  }
}
