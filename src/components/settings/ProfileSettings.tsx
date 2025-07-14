
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { UserSettings } from "@/services/settingsService";

interface ProfileSettingsProps {
  profile: UserSettings;
  timezone: string;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onTimezoneUpdate: (timezone: string) => void;
  isLoading?: boolean;
}

export const ProfileSettings = ({ profile, timezone, onUpdate, onTimezoneUpdate, isLoading }: ProfileSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-3 h-5 w-5" aria-hidden="true" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name *</Label>
            <Input 
              id="full-name" 
              value={profile.fullName} 
              onChange={(e) => onUpdate({ fullName: e.target.value })}
              disabled={isLoading}
              required 
              aria-describedby="full-name-help" 
            />
            <p id="full-name-help" className="text-sm text-muted-foreground">
              This name will be displayed in your account
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              type="email" 
              value={profile.email} 
              onChange={(e) => onUpdate({ email: e.target.value })}
              disabled={isLoading}
              required 
              aria-describedby="email-help" 
            />
            <p id="email-help" className="text-sm text-muted-foreground">
              Used for login and important notifications
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input 
              id="company" 
              value={profile.company} 
              onChange={(e) => onUpdate({ company: e.target.value })}
              disabled={isLoading}
              placeholder="Your company name" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select 
              id="timezone" 
              value={timezone} 
              onChange={(e) => onTimezoneUpdate(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
              aria-describedby="timezone-help"
            >
              <option value="UTC">UTC</option>
              <option value="US/Eastern">Eastern Time</option>
              <option value="US/Central">Central Time</option>
              <option value="US/Mountain">Mountain Time</option>
              <option value="US/Pacific">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
            <p id="timezone-help" className="text-sm text-muted-foreground">
              Used for scheduling and reporting
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
