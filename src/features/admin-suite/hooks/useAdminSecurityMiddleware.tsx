// Admin Security Middleware Hook
import { useEffect, useCallback } from 'react';
import { useEnhancedAdminAccess } from './useEnhancedAdminAccess';
import { logSecurityEvent } from '@/security/logger';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout

export const useAdminSecurityMiddleware = () => {
  const { 
    hasAccess, 
    sessionValid, 
    requiresRecentAuth, 
    invalidateSession,
    session 
  } = useEnhancedAdminAccess();

  // Track admin activity
  const trackActivity = useCallback(() => {
    if (!hasAccess) return;
    
    // Update last activity timestamp
    const lastActivity = Date.now();
    sessionStorage.setItem('admin_last_activity', lastActivity.toString());
    
    // Log security event
    logSecurityEvent('admin_activity', {
      timestamp: lastActivity,
      sessionValid,
      requiresRecentAuth
    });
  }, [hasAccess, sessionValid, requiresRecentAuth]);

  // Check session timeout
  const checkSessionTimeout = useCallback(() => {
    if (!hasAccess) return;

    const lastActivity = sessionStorage.getItem('admin_last_activity');
    if (!lastActivity) return;

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    
    if (timeSinceActivity > SESSION_TIMEOUT) {
      // Session timed out
      logSecurityEvent('admin_session_timeout', {
        timeSinceActivity,
        sessionTimeout: SESSION_TIMEOUT
      });
      
      invalidateSession();
      sessionStorage.removeItem('admin_last_activity');
      
      // Could trigger logout or session renewal
      console.warn('[AdminSecurity] Session timed out due to inactivity');
    } else if (timeSinceActivity > SESSION_TIMEOUT - WARNING_THRESHOLD) {
      // Show warning about impending timeout
      logSecurityEvent('admin_session_warning', {
        timeRemaining: SESSION_TIMEOUT - timeSinceActivity
      });
      
      console.warn('[AdminSecurity] Session timeout warning');
    }
  }, [hasAccess, invalidateSession]);

  // Setup activity tracking
  useEffect(() => {
    if (!hasAccess) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add activity listeners
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Setup timeout check interval
    const timeoutInterval = setInterval(checkSessionTimeout, 60 * 1000); // Check every minute

    return () => {
      // Cleanup listeners
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      
      clearInterval(timeoutInterval);
    };
  }, [hasAccess, trackActivity, checkSessionTimeout]);

  // Initialize activity tracking on mount
  useEffect(() => {
    if (hasAccess) {
      trackActivity();
    }
  }, [hasAccess, trackActivity]);

  return {
    isSessionActive: hasAccess && sessionValid,
    trackActivity,
    checkSessionTimeout
  };
};

// Rate limiting hook for admin actions
export const useAdminRateLimit = () => {
  const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const DEFAULT_LIMIT = 10; // 10 requests per minute

  const checkRateLimit = useCallback((action: string, limit: number = DEFAULT_LIMIT): boolean => {
    const now = Date.now();
    const current = rateLimitMap.get(action) || { count: 0, lastReset: now };

    // Reset if window has passed
    if (now - current.lastReset > RATE_LIMIT_WINDOW) {
      current.count = 0;
      current.lastReset = now;
    }

    // Check if limit exceeded
    if (current.count >= limit) {
      logSecurityEvent('admin_rate_limit_exceeded', {
        action,
        count: current.count,
        limit,
        timeWindow: RATE_LIMIT_WINDOW
      });
      return false;
    }

    // Increment counter
    current.count++;
    rateLimitMap.set(action, current);
    
    return true;
  }, []);

  const getRemainingRequests = useCallback((action: string, limit: number = DEFAULT_LIMIT): number => {
    const current = rateLimitMap.get(action);
    if (!current) return limit;

    const now = Date.now();
    if (now - current.lastReset > RATE_LIMIT_WINDOW) {
      return limit;
    }

    return Math.max(0, limit - current.count);
  }, []);

  return {
    checkRateLimit,
    getRemainingRequests
  };
};