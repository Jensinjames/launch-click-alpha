import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InvitationBadgeProps {
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-warning'
  },
  accepted: {
    label: 'Accepted',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-success'
  },
  declined: {
    label: 'Declined',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-destructive'
  },
  expired: {
    label: 'Expired',
    variant: 'outline' as const,
    icon: AlertCircle,
    color: 'text-muted-foreground'
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-sm px-4 py-1.5'
};

export const InvitationBadge: React.FC<InvitationBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        sizeClasses[size],
        'inline-flex items-center gap-1',
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('h-3 w-3', config.color)} />
      )}
      {config.label}
    </Badge>
  );
};