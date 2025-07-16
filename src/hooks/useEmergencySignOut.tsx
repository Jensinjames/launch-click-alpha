import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '@/services/logger/domainLoggers';

export const useEmergencySignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authLogger.userAction('emergency_signout_start', 'emergency_signout', { 
        hook: 'useEmergencySignOut' 
      });
      
      try {
        // Quick local cleanup first
        queryClient.clear();
        sessionStorage.clear();
        
        // Try to sign out with very short timeout
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Quick timeout')), 1000)
        );
        
        try {
          await Promise.race([signOutPromise, timeoutPromise]);
          await authLogger.success('Emergency supabase signout successful', false, { 
            hook: 'useEmergencySignOut' 
          });
        } catch (timeoutError) {
          await authLogger.warning('Emergency supabase signout timed out, proceeding with local cleanup', { 
            hook: 'useEmergencySignOut' 
          });
        }
        
        // Clear all localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            authLogger.warning('Failed to remove localStorage key', { 
              key, 
              hook: 'useEmergencySignOut' 
            });
          }
        });
        
        await authLogger.success('Emergency logout completed', false, { 
          hook: 'useEmergencySignOut' 
        });
        
      } catch (error) {
        await authLogger.error(error as Error, { 
          hook: 'useEmergencySignOut' 
        });
        // Continue anyway - we need to get the user out
      }
    },
    onSettled: () => {
      // Always redirect, regardless of success or error
      toast.success('Signed out');
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  });
};