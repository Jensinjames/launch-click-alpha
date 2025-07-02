import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Crown, Shield, Edit, Eye } from 'lucide-react';

export interface MemberAvatarProps {
  member: {
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
    status?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  showStatus?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="h-3 w-3 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-3 w-3 text-blue-500" />;
    case 'editor':
      return <Edit className="h-3 w-3 text-green-500" />;
    case 'viewer':
      return <Eye className="h-3 w-3 text-gray-500" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-success';
    case 'pending':
      return 'bg-warning';
    case 'inactive':
      return 'bg-muted';
    default:
      return 'bg-muted';
  }
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  size = 'md',
  showRole = false,
  showStatus = false,
  showTooltip = true,
  className = ''
}) => {
  const roleIcon = getRoleIcon(member.role);
  
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Avatar className={cn(sizeClasses[size], 'relative')}>
        <AvatarImage src={member.avatar_url} alt={member.name} />
        <AvatarFallback className="text-sm font-medium">
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
        
        {/* Status indicator */}
        {showStatus && member.status && (
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
            getStatusColor(member.status)
          )} />
        )}
        
        {/* Role icon */}
        {showRole && roleIcon && (
          <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border">
            {roleIcon}
          </div>
        )}
      </Avatar>
      
      {showRole && !roleIcon && (
        <Badge 
          variant="secondary" 
          className="ml-2 text-xs capitalize"
        >
          {member.role}
        </Badge>
      )}
    </div>
  );
};