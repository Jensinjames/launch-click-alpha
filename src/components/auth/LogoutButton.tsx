
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuthMutations } from '@/hooks/useAuthMutations';
import { authLogger } from '@/services/logger/domainLoggers';
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

export interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showConfirmation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton = ({ 
  variant = 'ghost', 
  size = 'default', 
  showConfirmation = false,
  className = '',
  children,
  ...props 
}: LogoutButtonProps) => {
  const { signOut } = useAuthMutations();

  const handleDirectLogout = async () => {
    await authLogger.userAction('logout_start', 'logout', { 
      type: 'direct',
      component: 'LogoutButton' 
    });
    
    try {
      await signOut.mutateAsync();
      await authLogger.success('Logout completed successfully', false, { 
        type: 'direct',
        component: 'LogoutButton' 
      });
    } catch (error) {
      await authLogger.error(error as Error, { 
        type: 'direct',
        component: 'LogoutButton' 
      });
    }
  };

  const handleConfirmedLogout = async () => {
    await authLogger.userAction('logout_start', 'logout', { 
      type: 'confirmed',
      component: 'LogoutButton' 
    });
    
    try {
      await signOut.mutateAsync();
      await authLogger.success('Logout completed successfully', false, { 
        type: 'confirmed',
        component: 'LogoutButton' 
      });
    } catch (error) {
      await authLogger.error(error as Error, { 
        type: 'confirmed',
        component: 'LogoutButton' 
      });
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
    // Rendering direct logout button
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
  // Rendering confirmation logout button
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

export default LogoutButton;
