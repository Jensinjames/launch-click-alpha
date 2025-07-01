
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { NotificationSettings as NotificationSettingsType } from "@/services/settingsService";

interface NotificationSettingsProps {
  notifications: NotificationSettingsType;
  onUpdate: (updates: Partial<NotificationSettingsType>) => void;
  isLoading?: boolean;
}

export const NotificationSettings = ({ notifications, onUpdate, isLoading }: NotificationSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-3 h-5 w-5" aria-hidden="true" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates" className="text-base font-medium">
                Email Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive important account updates via email
              </p>
            </div>
            <Switch 
              id="email-updates" 
              checked={notifications.emailUpdates} 
              onCheckedChange={(checked) => onUpdate({ emailUpdates: checked })}
              disabled={isLoading}
              aria-describedby="email-updates-desc" 
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="credit-alerts" className="text-base font-medium">
                Credit Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your credits are running low
              </p>
            </div>
            <Switch 
              id="credit-alerts" 
              checked={notifications.creditAlerts} 
              onCheckedChange={(checked) => onUpdate({ creditAlerts: checked })}
              disabled={isLoading}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-report" className="text-base font-medium">
                Weekly Usage Report
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your weekly activity
              </p>
            </div>
            <Switch 
              id="weekly-report" 
              checked={notifications.weeklyReport} 
              onCheckedChange={(checked) => onUpdate({ weeklyReport: checked })}
              disabled={isLoading}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails" className="text-base font-medium">
                Marketing Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive tips, feature updates, and promotions
              </p>
            </div>
            <Switch 
              id="marketing-emails" 
              checked={notifications.marketingEmails} 
              onCheckedChange={(checked) => onUpdate({ marketingEmails: checked })}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
