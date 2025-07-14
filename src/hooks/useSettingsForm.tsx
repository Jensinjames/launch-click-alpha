
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SettingsService, UserSettings, NotificationSettings, PrivacySettings } from '@/services/settingsService';
import { toast } from 'sonner';

// Type guards for JSONB data validation
const isObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const getObjectProperty = (obj: any, key: string, defaultValue: any = null) => {
  if (isObject(obj) && key in obj) {
    return obj[key];
  }
  return defaultValue;
};

export const useSettingsForm = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profile, setProfile] = useState<UserSettings>({
    fullName: '',
    email: '',
    company: ''
  });

  const [timezone, setTimezone] = useState<string>('UTC');

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailUpdates: true,
    creditAlerts: true,
    weeklyReport: false,
    marketingEmails: false
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisible: true,
    analyticsSharing: false,
    dataExport: true
  });

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const settings = await SettingsService.getUserSettings(user.id);
        
        // Update profile state
        if (settings.profile) {
          setProfile({
            fullName: settings.profile.full_name || '',
            email: user.email || '',
            company: settings.profile.company_name || ''
          });
        } else {
          // Set defaults from user object
          setProfile(prev => ({
            ...prev,
            fullName: user.user_metadata?.full_name || '',
            email: user.email || ''
          }));
        }

        // Update timezone from preferences
        if (settings.preferences?.timezone) {
          setTimezone(settings.preferences.timezone);
        }

        // Update notification preferences with proper type checking
        if (settings.preferences?.email_notifications) {
          const emailNotifs = settings.preferences.email_notifications;
          setNotifications({
            emailUpdates: getObjectProperty(emailNotifs, 'content_ready', true),
            creditAlerts: getObjectProperty(emailNotifs, 'credit_alerts', true),
            weeklyReport: getObjectProperty(emailNotifs, 'weekly_summary', false),
            marketingEmails: getObjectProperty(emailNotifs, 'marketing', false)
          });
        }

        // Update privacy settings with proper type checking
        if (settings.preferences?.default_content_settings) {
          const contentSettings = settings.preferences.default_content_settings;
          setPrivacy({
            profileVisible: getObjectProperty(contentSettings, 'profile_visible', true),
            analyticsSharing: getObjectProperty(contentSettings, 'analytics_sharing', false),
            dataExport: getObjectProperty(contentSettings, 'data_export_enabled', true)
          });
        }

      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load your settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateProfile = (updates: Partial<UserSettings>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setNotifications(prev => ({ ...prev, ...updates }));
  };

  const updatePrivacy = (updates: Partial<PrivacySettings>) => {
    setPrivacy(prev => ({ ...prev, ...updates }));
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await Promise.all([
        SettingsService.updateProfile(user.id, profile),
        SettingsService.updateTimezone(user.id, timezone),
        SettingsService.updateNotificationPreferences(user.id, notifications),
        SettingsService.updatePrivacySettings(user.id, privacy)
      ]);

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      await SettingsService.deleteUserAccount(user.id);
      toast.success('Account deleted successfully');
      // User will be redirected by auth state change
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  return {
    // States
    profile,
    notifications,
    privacy,
    timezone,
    isLoading,
    isSaving,
    
    // Actions
    updateProfile,
    updateNotifications,
    updatePrivacy,
    setTimezone,
    saveSettings,
    deleteAccount
  };
};
