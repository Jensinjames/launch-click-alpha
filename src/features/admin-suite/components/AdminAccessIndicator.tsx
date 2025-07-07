// Admin Access Status Indicator
import { useEnhancedAdminAccess } from '../hooks/useEnhancedAdminAccess';
import { Button } from '@/components/ui/button';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AdminAccessIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const AdminAccessIndicator = ({ className, showDetails = false }: AdminAccessIndicatorProps) => {
  const navigate = useNavigate();
  const { 
    hasAccess, 
    accessLevel, 
    role, 
    planType, 
    sessionValid, 
    requiresRecentAuth,
    isLoading 
  } = useEnhancedAdminAccess();

  const handleClick = () => {
    if (hasAccess && sessionValid && !requiresRecentAuth) {
      navigate('/admin');
    }
  };

  if (isLoading) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled
        className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-border bg-background text-foreground gap-1", className)}
      >
        <Shield className="h-3 w-3 animate-pulse" />
        Checking...
      </Button>
    );
  }

  if (!hasAccess || !sessionValid) {
    return showDetails ? (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled
        className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-destructive bg-destructive text-destructive-foreground gap-1", className)}
      >
        <AlertTriangle className="h-3 w-3" />
        No Admin Access
      </Button>
    ) : null;
  }

  if (requiresRecentAuth) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled
        className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-secondary bg-secondary text-secondary-foreground gap-1", className)}
      >
        <Clock className="h-3 w-3" />
        {showDetails ? "Auth Required" : "Auth"}
      </Button>
    );
  }

  const getAccessBadgeStyles = () => {
    switch (accessLevel) {
      case 'super_admin':
        return "border-primary bg-primary text-primary-foreground hover:bg-primary/80";
      case 'billing_admin':
        return "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80";
      case 'team_admin':
        return "border-border bg-background text-foreground hover:bg-accent";
      default:
        return "border-border bg-background text-foreground hover:bg-accent";
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
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold gap-1 cursor-pointer transition-all hover:scale-105",
        getAccessBadgeStyles(),
        className
      )}
    >
      <CheckCircle className="h-3 w-3" />
      {getAccessLabel()}
      {showDetails && (
        <span className="text-xs opacity-75">
          ({planType})
        </span>
      )}
    </Button>
  );
};

export default AdminAccessIndicator;