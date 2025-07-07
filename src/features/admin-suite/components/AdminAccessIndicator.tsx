// Admin Access Status Indicator
import { useEnhancedAdminAccess } from '../hooks/useEnhancedAdminAccess';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminAccessIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const AdminAccessIndicator = ({ className, showDetails = false }: AdminAccessIndicatorProps) => {
  const { 
    hasAccess, 
    accessLevel, 
    role, 
    planType, 
    sessionValid, 
    requiresRecentAuth,
    isLoading 
  } = useEnhancedAdminAccess();

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Shield className="h-3 w-3 animate-pulse" />
        Checking...
      </Badge>
    );
  }

  if (!hasAccess || !sessionValid) {
    return showDetails ? (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <AlertTriangle className="h-3 w-3" />
        No Admin Access
      </Badge>
    ) : null;
  }

  if (requiresRecentAuth) {
    return (
      <Badge variant="secondary" className={cn("gap-1", className)}>
        <Clock className="h-3 w-3" />
        {showDetails ? "Auth Required" : "Auth"}
      </Badge>
    );
  }

  const getAccessBadgeVariant = () => {
    switch (accessLevel) {
      case 'super_admin':
        return 'default' as const;
      case 'billing_admin':
        return 'secondary' as const;
      case 'team_admin':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getAccessLabel = () => {
    if (!showDetails) return 'Admin';
    
    switch (accessLevel) {
      case 'super_admin':
        return 'Super Admin';
      case 'billing_admin':
        return 'Billing Admin';
      case 'team_admin':
        return 'Team Admin';
      case 'user_admin':
        return 'User Admin';
      default:
        return 'Admin';
    }
  };

  return (
    <Badge variant={getAccessBadgeVariant()} className={cn("gap-1", className)}>
      <CheckCircle className="h-3 w-3" />
      {getAccessLabel()}
      {showDetails && (
        <span className="text-xs opacity-75">
          ({planType})
        </span>
      )}
    </Badge>
  );
};

export default AdminAccessIndicator;