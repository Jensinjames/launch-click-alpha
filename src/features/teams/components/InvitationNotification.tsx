import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { InvitationBadge } from './InvitationBadge';
import { cn } from '@/lib/utils';

export interface InvitationNotificationProps {
  invitation: {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    team: {
      name: string;
      id: string;
    };
    invited_by: {
      name: string;
      avatar_url?: string;
    };
    created_at: string;
    expires_at: string;
  };
  onAccept?: (invitationId: string) => void;
  onDecline?: (invitationId: string) => void;
  className?: string;
}

export const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  invitation,
  onAccept,
  onDecline,
  className = ''
}) => {
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isPending = invitation.status === 'pending' && !isExpired;
  const canAct = isPending && (onAccept || onDecline);

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isPending && 'border-primary/50 bg-primary/5',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <UserPlus className={cn(
              'h-5 w-5',
              isPending ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">
                Team Invitation
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                From {invitation.invited_by.name} • {new Date(invitation.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <InvitationBadge status={invitation.status} size="sm" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={invitation.invited_by.avatar_url} alt={invitation.invited_by.name} />
            <AvatarFallback className="text-xs">
              {invitation.invited_by.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {invitation.invited_by.name} invited you to join
            </p>
            <p className="text-sm text-primary font-medium">
              {invitation.team.name}
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Role: <span className="capitalize font-medium text-foreground">{invitation.role}</span>
          {isExpired && (
            <p className="text-destructive text-xs mt-1">
              This invitation expired on {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {canAct && (
          <div className="flex space-x-2">
            {onAccept && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onAccept(invitation.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            )}
            {onDecline && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDecline(invitation.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            )}
          </div>
        )}

        {invitation.status === 'accepted' && (
          <div className="text-center py-2">
            <p className="text-sm text-success">✓ You accepted this invitation</p>
          </div>
        )}

        {invitation.status === 'declined' && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">You declined this invitation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};