// Unified Auth Security - Rate Limiting & Validation
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from './logger';
import type { RateLimitState } from './types';

// Client-side rate limiting state
const authAttempts = new Map<string, RateLimitState>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Enhanced server-side rate limiting with fallback
export const checkServerRateLimit = async (
  identifier: string, 
  maxAttempts = 5, 
  timeWindowMinutes = 15
): Promise<boolean> => {
  try {
    const { data: isAllowed, error } = await supabase.rpc('check_rate_limit', {
      identifier,
      max_attempts: maxAttempts,
      time_window_minutes: timeWindowMinutes
    });

    if (error) {
      console.warn('Server rate limit check failed:', error);
      return isRateLimited(identifier); // Fallback to client-side
    }

    return isAllowed;
  } catch (error) {
    console.warn('Rate limit service unavailable:', error);
    return isRateLimited(identifier); // Fallback to client-side
  }
};

// Client-side rate limiting (fallback)
export const isRateLimited = (email: string): boolean => {
  const attempts = authAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
};

export const recordAttempt = (email: string, success: boolean): void => {
  const now = Date.now();
  const attempts = authAttempts.get(email) || { count: 0, lastAttempt: now };
  
  if (success) {
    authAttempts.delete(email);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
    authAttempts.set(email, attempts);
  }
};

// Input validation with XSS protection
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): void => {
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    throw new Error('Email is required');
  }
  
  if (sanitized.length > 254) {
    throw new Error('Email address is too long');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized.toLowerCase())) {
    throw new Error('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (!password) {
    throw new Error('Password is required');
  }
  
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password is too long');
  }
};

// Simple admin validation - no recursive calls
export const validateAdminAccess = async (): Promise<boolean> => {
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
};

// Enhanced admin validation with recent auth requirement
export const validateAdminAccessEnhanced = async (requireRecentAuth = false): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      return false;
    }
    
    // For sensitive operations, require recent authentication (within 30 minutes)
    if (requireRecentAuth) {
      const authTime = new Date(session.session.user.last_sign_in_at || 0);
      const now = new Date();
      const timeDiff = now.getTime() - authTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (timeDiff > thirtyMinutes) {
        logSecurityEvent('admin_session_expired', {
          userId: session.session.user.id,
          lastSignIn: session.session.user.last_sign_in_at,
          timeDiff
        });
        return false;
      }
    }
    
    const { data: isValid, error } = await supabase.rpc('validate_admin_session');
    
    if (error) {
      logSecurityEvent('admin_validation_error', { error: error.message });
      return false;
    }
    
    if (isValid) {
      logSecurityEvent('admin_access_granted', { 
        userId: session.session.user.id,
        requireRecentAuth 
      });
    } else {
      logSecurityEvent('admin_access_denied', { 
        userId: session.session.user.id,
        requireRecentAuth 
      });
    }
    
    return isValid || false;
  } catch (error) {
    logSecurityEvent('admin_validation_exception', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
};