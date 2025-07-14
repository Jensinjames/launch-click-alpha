// Settings Data Transformation Service
import type { UserSettings, NotificationSettings, PrivacySettings, CompleteUserSettings } from '@/types/settings';

export class SettingsTransformService {
  /**
   * Type-safe helper to get object property with default value
   */
  static getObjectProperty<T>(obj: unknown, key: string, defaultValue: T): T {
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj !== null && key in obj) {
      return (obj as Record<string, unknown>)[key] as T;
    }
    return defaultValue;
  }

  /**
   * Transform database user settings to app format
   */
  static transformUserSettings(settings: CompleteUserSettings, userEmail: string): {
    profile: UserSettings;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    timezone: string;
  } {
    const profile: UserSettings = {
      fullName: settings.profile?.full_name || '',
      email: userEmail,
      company: settings.profile?.company_name || ''
    };

    const notifications: NotificationSettings = {
      emailUpdates: this.getObjectProperty(settings.preferences?.email_notifications, 'content_ready', true),
      creditAlerts: this.getObjectProperty(settings.preferences?.email_notifications, 'credit_alerts', true),
      weeklyReport: this.getObjectProperty(settings.preferences?.email_notifications, 'weekly_summary', false),
      marketingEmails: this.getObjectProperty(settings.preferences?.email_notifications, 'marketing', false)
    };

    const privacy: PrivacySettings = {
      profileVisible: this.getObjectProperty(settings.preferences?.default_content_settings, 'profile_visible', true),
      analyticsSharing: this.getObjectProperty(settings.preferences?.default_content_settings, 'analytics_sharing', false),
      dataExport: this.getObjectProperty(settings.preferences?.default_content_settings, 'data_export_enabled', true)
    };

    const timezone = settings.preferences?.timezone || 'UTC';

    return { profile, notifications, privacy, timezone };
  }

  /**
   * Validate settings before save
   */
  static validateSettings(profile: UserSettings, notifications: NotificationSettings, privacy: PrivacySettings): string[] {
    const errors: string[] = [];

    if (!profile.fullName.trim()) {
      errors.push('Full name is required');
    }

    if (!profile.email.trim()) {
      errors.push('Email is required');
    }

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Please enter a valid email address');
    }

    return errors;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}