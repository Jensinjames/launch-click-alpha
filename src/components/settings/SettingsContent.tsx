
import { ProfileSettings } from "./ProfileSettings";
import { NotificationSettings } from "./NotificationSettings";
import { PrivacySettings } from "./PrivacySettings";
import { DangerZoneSettings } from "./DangerZoneSettings";
import { SettingsSaveButton } from "./SettingsSaveButton";
import { useSettingsForm } from "@/hooks/useSettingsForm";

export const SettingsContent = () => {
  const {
    profile,
    notifications,
    privacy,
    timezone,
    isSaving,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    setTimezone,
    saveSettings,
    deleteAccount,
  } = useSettingsForm();

  return (
    <div className="space-y-8">
      <ProfileSettings 
        profile={profile}
        timezone={timezone}
        onUpdate={updateProfile}
        onTimezoneUpdate={setTimezone}
        isLoading={isSaving}
      />

      <NotificationSettings 
        notifications={notifications}
        onUpdate={updateNotifications}
        isLoading={isSaving}
      />

      <PrivacySettings 
        privacy={privacy}
        onUpdate={updatePrivacy}
        isLoading={isSaving}
      />

      <DangerZoneSettings 
        onDeleteAccount={deleteAccount}
        isLoading={isSaving}
      />

      <SettingsSaveButton 
        onSave={saveSettings}
        isSaving={isSaving}
      />
    </div>
  );
};
