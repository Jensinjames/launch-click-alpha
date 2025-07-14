
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SettingsService } from '@/services/settingsService';
import { SettingsTransformService } from '@/services/settingsTransformService';
import { toast } from 'sonner';
import type { UserSettings, NotificationSettings, PrivacySettings } from '@/types/settings';

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
        
        // Transform settings using dedicated service
        const transformedSettings = SettingsTransformService.transformUserSettings(
          { profile: settings.profile, preferences: settings.preferences },
          user.email || ''
        );

        setProfile(transformedSettings.profile);
        setNotifications(transformedSettings.notifications);
        setPrivacy(transformedSettings.privacy);
        setTimezone(transformedSettings.timezone);

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

    // Validate settings before saving
    const validationErrors = SettingsTransformService.validateSettings(profile, notifications, privacy);
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

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
