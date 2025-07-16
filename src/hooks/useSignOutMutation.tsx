
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '@/services/logger/domainLoggers';

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authLogger.userAction('signout_process_start', 'signout', { 
        hook: 'useSignOutMutation' 
      });
      
      try {
        // Step 1: Check if we have a session to sign out
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          await authLogger.info('No active session found, performing local cleanup only', { 
            hook: 'useSignOutMutation',
            step: 'session_check' 
          });
          // Perform local cleanup even without session
          queryClient.clear();
          sessionStorage.clear();
          return;
        }
        
        await authLogger.info('Active session found, signing out...', { 
          hook: 'useSignOutMutation',
          step: 'session_found',
          sessionId: session.access_token?.substring(0, 10) + '...' 
        });
        
        // Step 2: Sign out from Supabase with timeout
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Signout timeout')), 3000)
        );
        
        try {
          const { error } = await Promise.race([signOutPromise, timeoutPromise]);
          
          if (error) {
            await authLogger.error(error, { 
              hook: 'useSignOutMutation',
              step: 'supabase_signout' 
            });
            throw error;
          }
          
          await authLogger.success('Supabase signout successful', false, { 
            hook: 'useSignOutMutation',
            step: 'supabase_signout' 
          });
        } catch (timeoutError) {
          await authLogger.error(timeoutError as Error, { 
            hook: 'useSignOutMutation',
            step: 'supabase_signout_timeout' 
          });
          // Continue with local cleanup even if signout fails
        }
        
        // Step 3: Local cleanup (always perform this)
        await authLogger.info('Performing local cleanup...', { 
          hook: 'useSignOutMutation',
          step: 'local_cleanup' 
        });
        queryClient.clear();
        sessionStorage.clear();
        
        // Clear Supabase keys from localStorage
        const supabaseKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('supabase')) {
            supabaseKeys.push(key);
          }
        }
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        await authLogger.success('Logout process completed successfully', false, { 
          hook: 'useSignOutMutation',
          step: 'complete' 
        });
        
      } catch (error) {
        await authLogger.error(error as Error, { 
          hook: 'useSignOutMutation',
          step: 'error_handling' 
        });
        
        // Emergency cleanup on error
        try {
          queryClient.clear();
          sessionStorage.clear();
          await authLogger.info('Emergency cleanup completed', { 
            hook: 'useSignOutMutation',
            step: 'emergency_cleanup' 
          });
        } catch (cleanupError) {
          await authLogger.error(cleanupError as Error, { 
            hook: 'useSignOutMutation',
            step: 'emergency_cleanup_failed' 
          });
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      authLogger.success('Signout success callback executed', false, { 
        hook: 'useSignOutMutation',
        callback: 'onSuccess' 
      });
      toast.success('Signed out successfully');
      
      // Force navigation after short delay
      setTimeout(() => {
        authLogger.userAction('redirect_to_home', 'signout', { 
          hook: 'useSignOutMutation',
          callback: 'onSuccess' 
        });
        window.location.replace('/');
      }, 300);
    },
    onError: (error: any) => {
      authLogger.error(error, { 
        hook: 'useSignOutMutation',
        callback: 'onError' 
      });
      
      toast.error('You have been signed out');
      
      // Force navigation even on error
      setTimeout(() => {
        authLogger.userAction('force_redirect_after_error', 'signout', { 
          hook: 'useSignOutMutation',
          callback: 'onError' 
        });
        window.location.replace('/');
      }, 500);
    },
  });
};
