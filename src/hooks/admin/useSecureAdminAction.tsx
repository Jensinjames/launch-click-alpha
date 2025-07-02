import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecureAdminActionOptions {
  requireFreshSession?: boolean;
  maxSessionAge?: number;
}

/**
 * Hook for performing admin actions with enhanced security validation
 */
export const useSecureAdminAction = <T, R>(
  action: (data: T) => Promise<R>,
  options: SecureAdminActionOptions = {}
) => {
  const { requireFreshSession = true, maxSessionAge = 30 } = options;

  return useMutation({
    mutationFn: async (data: T): Promise<R> => {
      // Validate admin session freshness for sensitive operations
      if (requireFreshSession) {
        const { data: sessionValid, error: sessionError } = await supabase.rpc('require_fresh_admin_session', {
          max_age_minutes: maxSessionAge
        });

        if (sessionError) {
          console.error('[SecureAdminAction] Session validation error:', sessionError);
          throw new Error('Unable to validate admin session');
        }

        if (!sessionValid) {
          throw new Error('Fresh admin authentication required. Please sign in again.');
        }
      }

      // Execute the admin action
      return await action(data);
    },
    onError: async (error: any) => {
      const message = error.message || 'Admin operation failed';
      toast.error(message);
      
      // Log security events for failed admin operations (fire and forget)
      try {
        await supabase.rpc('log_security_event', {
          event_type: 'admin_operation_failed',
          event_data: {
            error: message,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
    }
  });
};