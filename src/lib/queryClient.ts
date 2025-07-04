import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes for better caching
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        // Handle session expired errors
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Session Expired') ||
            error?.message?.includes('JWT expired')) {
          handleSessionExpired();
          return false;
        }
        
        // Don't retry on authentication errors
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('auth') ||
            error?.status === 401) {
          return false;
        }
        
        // Only retry once for other errors
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Prevent unnecessary refetches
      networkMode: 'online',
      // Add background refetching for better UX
      refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('auth') ||
            error?.status === 401) {
          return false;
        }
        
        // Retry network errors once
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          return failureCount < 1;
        }
        
        return false;
      },
      onError: (error: any) => {
        console.error('Mutation error:', error);
        
        // Handle session expired errors
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Session Expired')) {
          handleSessionExpired();
          return;
        }
        
        // Only show toast for non-auth errors
        const message = error?.message || 'An error occurred';
        if (!message.includes('JWT') && 
            !message.includes('Invalid credentials') &&
            !message.includes('auth')) {
          toast.error(message);
        }
      },
      networkMode: 'online',
    },
  },
});

// Optimized session expiry handler
async function handleSessionExpired() {
  try {
    console.log('[QueryClient] Handling session expiry...');
    
    // Clear cache first to prevent stale data
    queryClient.clear();
    
    // Sign out without waiting (fire and forget)
    supabase.auth.signOut().catch(error => {
      console.warn('[QueryClient] Signout during session expiry failed:', error);
    });
    
    // Show user-friendly message
    toast.error('Your session has expired. Please sign in again.');
    
    // Redirect immediately
    window.location.replace('/login');
  } catch (error) {
    console.error('[QueryClient] Error handling session expiry:', error);
    // Force redirect even if cleanup fails
    window.location.replace('/login');
  }
}
