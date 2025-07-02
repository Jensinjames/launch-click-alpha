import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, Users, UserPlus } from 'lucide-react';
import { TeamNotification as TeamNotificationType } from '../../types/teamWorkflow';
import { cn } from '@/lib/utils';

export interface TeamNotificationProps {
  notification: TeamNotificationType;
  onMarkAsRead?: (id: string) => void;
  onAction?: (action: string, notificationId: string) => void;
  className?: string;
}

const notificationIcons = {
  invite: UserPlus,
  member_added: Users,
  member_removed: Users,
  role_changed: Users,
  team_updated: Bell,
  default: Bell,
};

const notificationVariants = {
  info: 'default',
  success: 'default',
  warning: 'secondary',
  error: 'destructive',
} as const;

export const TeamNotificationCard: React.FC<TeamNotificationProps> = ({
  notification,
  onMarkAsRead,
  onAction,
  className = ''
}) => {
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.default;
  const isUnread = !notification.read_at;

  const handleMarkAsRead = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isUnread && 'border-primary/50 bg-primary/5',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn(
              'h-5 w-5',
              isUnread ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">
                {notification.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                {new Date(notification.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          {isUnread && (
            <Badge variant="default" className="text-xs">
              New
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-foreground mb-3">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {notification.data?.action_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAction?.('view', notification.id)}
              >
                View Details
              </Button>
            )}
            {notification.data?.accept_action && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onAction?.('accept', notification.id)}
              >
                Accept
              </Button>
            )}
            {notification.data?.decline_action && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAction?.('decline', notification.id)}
              >
                Decline
              </Button>
            )}
          </div>
          
          {isUnread && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAsRead}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark as read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};