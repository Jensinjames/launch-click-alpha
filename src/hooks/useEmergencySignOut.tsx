import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEmergencySignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[Emergency SignOut] Starting simplified logout...');
      
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
          console.log('[Emergency SignOut] Supabase signout successful');
        } catch (timeoutError) {
          console.log('[Emergency SignOut] Supabase signout timed out, proceeding with local cleanup');
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
            console.warn('Failed to remove localStorage key:', key);
          }
        });
        
        console.log('[Emergency SignOut] Emergency logout completed');
        
      } catch (error) {
        console.error('[Emergency SignOut] Error during emergency logout:', error);
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