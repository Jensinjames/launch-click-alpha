import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useEmergencySignOut } from '@/hooks/useEmergencySignOut';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export interface EmergencyLogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showConfirmation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const EmergencyLogoutButton = ({ 
  variant = 'ghost', 
  size = 'default', 
  showConfirmation = false,
  className = '',
  children,
  ...props 
}: EmergencyLogoutButtonProps) => {
  const signOut = useEmergencySignOut();

  const handleDirectLogout = async () => {
    console.log('[EmergencyLogoutButton] Direct logout initiated');
    
    try {
      await signOut.mutateAsync();
      console.log('[EmergencyLogoutButton] Direct logout completed successfully');
    } catch (error) {
      console.error('[EmergencyLogoutButton] Direct logout failed:', error);
    }
  };

  const handleConfirmedLogout = async () => {
    console.log('[EmergencyLogoutButton] Confirmed logout initiated');
    
    try {
      await signOut.mutateAsync();
      console.log('[EmergencyLogoutButton] Confirmed logout completed successfully');
    } catch (error) {
      console.error('[EmergencyLogoutButton] Confirmed logout failed:', error);
    }
  };

  // Common button content
  const buttonContent = (
    <>
      {signOut.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          {children || 'Logout'}
        </>
      )}
    </>
  );

  // For non-confirmation mode, use the button directly
  if (!showConfirmation) {
    console.log('[EmergencyLogoutButton] Rendering direct logout button');
    return (
      <Button
        variant={variant}
        size={size}
        disabled={signOut.isPending}
        className={className}
        onClick={handleDirectLogout}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }

  // For confirmation mode, wrap with AlertDialog
  console.log('[EmergencyLogoutButton] Rendering confirmation logout button');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={signOut.isPending}
          className={className}
          {...props}
        >
          {buttonContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={signOut.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmedLogout}
            disabled={signOut.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {signOut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmergencyLogoutButton;