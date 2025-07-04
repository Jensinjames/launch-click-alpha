
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';

// Import from centralized types
import type { SignUpData, SignInData, AuthResult } from '@/types/core';

export type { SignUpData, SignInData, AuthResult };

export class AuthService {
  // Sign up with email and password
  static async signUp(data: SignUpData): Promise<AuthResult> {
    const { email, password, fullName } = data;
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: fullName ? { full_name: fullName.trim() } : undefined
      }
    });

    return {
      user: authData.user,
      session: authData.session,
      error
    };
  }

  // Sign in with email and password
  static async signIn(data: SignInData): Promise<AuthResult> {
    const { email, password } = data;
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return {
      user: authData.user,
      session: authData.session,
      error
    };
  }

  // Sign out user
  static async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Resend confirmation email
  static async resendConfirmation(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    return { error };
  }

  // Get current session
  static async getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  // Refresh session
  static async refreshSession(): Promise<AuthResult> {
    const { data, error } = await supabase.auth.refreshSession();
    return {
      user: data.user,
      session: data.session,
      error
    };
  }

  // Check server-side rate limiting
  static async checkRateLimit(identifier: string, maxAttempts = 5, timeWindowMinutes = 15): Promise<boolean> {
    try {
      const { data: isAllowed, error } = await supabase.rpc('check_rate_limit', {
        identifier,
        max_attempts: maxAttempts,
        time_window_minutes: timeWindowMinutes
      });

      if (error) {
        console.warn('Server rate limit check failed:', error);
        return true; // Allow by default if server check fails
      }

      return isAllowed;
    } catch (error) {
      console.warn('Rate limit service unavailable:', error);
      return true; // Allow by default if service unavailable
    }
  }

  // Validate admin access
  static async validateAdminAccess(): Promise<boolean> {
    try {
      const { data: isValid, error } = await supabase.rpc('validate_admin_session');
      
      if (error) {
        console.error('Admin validation failed:', error);
        return false;
      }
      
      return isValid || false;
    } catch (error) {
      console.error('Admin validation service unavailable:', error);
      return false;
    }
  }

  // Log security events
  static async logSecurityEvent(eventType: string, eventData: any = {}): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        event_type: eventType,
        event_data: eventData
      });
    } catch (error) {
      // Silently fail security logging to not disrupt user flow
      console.warn('Security event logging failed:', error);
    }
  }
}
