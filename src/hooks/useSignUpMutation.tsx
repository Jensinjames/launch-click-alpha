
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { checkServerRateLimit, recordAttempt, validateEmail, validatePassword, sanitizeInput, logSecurityEvent } from '@/security';

// Import from centralized types
import type { SignUpData } from '@/types/core';

export const useSignUpMutation = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ email, password, fullName }: SignUpData) => {
      const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
      
      // Enhanced input validation
      validateEmail(normalizedEmail);
      validatePassword(password);
      
      // Enhanced rate limiting with server-side validation
      const isAllowed = await checkServerRateLimit(normalizedEmail);
      if (!isAllowed) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      await logSecurityEvent('signup_attempt', { email: normalizedEmail });
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: sanitizeInput(fullName.trim()) } : undefined
        }
      });

      if (error) {
        recordAttempt(normalizedEmail, false);
        await logSecurityEvent('signup_failed', { 
          email: normalizedEmail, 
          error: error.message 
        });
        throw error;
      }
      
      recordAttempt(normalizedEmail, true);
      await logSecurityEvent('signup_success', { email: normalizedEmail });
      
      return data;
    },
    onSuccess: (data) => {
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Account created! Please check your email (including spam folder) to confirm your account before signing in.', {
          duration: 7000,
        });
      } else if (data.user && data.user.email_confirmed_at) {
        toast.success('Account created and confirmed! Redirecting to dashboard...', {
          duration: 3000,
        });
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.success('Account created successfully! Please check your email to confirm your account.', {
          duration: 7000,
        });
      }
    },
    onError: (error: any) => {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('Invalid email') || error.message.includes('email format')) {
        toast.error('Please enter a valid email address.');
      } else if (error.message.includes('Password') || error.message.includes('12 characters')) {
        toast.error('Password must meet security requirements: 12+ characters with uppercase, lowercase, number, and special character.');
      } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
        toast.error('Too many attempts. Please wait before trying again.');
      } else if (error.message.includes('Database error')) {
        toast.error('There was an issue creating your account. Please try again.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    },
  });
};
