import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Settings, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TeamMemberWithCredits } from '@/types/team';

export interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    role: string;
    created_at: string;
    owner?: {
      name: string;
      avatar_url?: string;
    };
  };
  onManage?: (teamId: string) => void;
  onLeave?: (teamId: string) => void;
  onSettings?: (teamId: string) => void;
  className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onManage,
  onLeave,
  onSettings,
  className = ''
}) => {
  const canManage = team.role === 'owner' || team.role === 'admin';
  const isOwner = team.role === 'owner';

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold truncate">{team.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManage && (
              <DropdownMenuItem onClick={() => onManage?.(team.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Team
              </DropdownMenuItem>
            )}
            {canManage && (
              <DropdownMenuItem onClick={() => onSettings?.(team.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Team Settings
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem 
                onClick={() => onLeave?.(team.id)}
                className="text-destructive focus:text-destructive"
              >
                Leave Team
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {team.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{team.memberCount} members</span>
          </div>
          
          <Badge variant={team.role === 'owner' ? 'default' : 'secondary'}>
            {team.role}
          </Badge>
        </div>

        {team.owner && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarImage src={team.owner.avatar_url} alt={team.owner.name} />
              <AvatarFallback className="text-xs">
                {team.owner.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Owner: {team.owner.name}
            </span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Created {new Date(team.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};