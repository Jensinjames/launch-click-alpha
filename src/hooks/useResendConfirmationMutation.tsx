
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isRateLimited, recordAttempt, logSecurityEvent } from '@/security';

export const useResendConfirmationMutation = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Security: Rate limiting for confirmation emails
      if (isRateLimited(`confirm_${normalizedEmail}`)) {
        throw new Error('Please wait before requesting another confirmation email.');
      }
      
      await logSecurityEvent('resend_confirmation_attempt', { email: normalizedEmail });
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        recordAttempt(`confirm_${normalizedEmail}`, false);
        await logSecurityEvent('resend_confirmation_failed', { 
          email: normalizedEmail, 
          error: error.message 
        });
        throw error;
      }
      
      recordAttempt(`confirm_${normalizedEmail}`, true);
      await logSecurityEvent('resend_confirmation_success', { email: normalizedEmail });
    },
    onSuccess: () => {
      toast.success('Confirmation email sent! Please check your inbox and spam folder.');
    },
    onError: (error: any) => {
      if (error.message.includes('rate limit') || error.message.includes('wait')) {
        toast.error('Please wait before requesting another confirmation email.');
      } else {
        toast.error(error.message || 'Failed to resend confirmation email');
      }
    },
  });
};
