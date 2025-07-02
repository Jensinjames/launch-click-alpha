// Enhanced Security Provider with Optimized Logging
import { useEffect, ReactNode, useCallback } from 'react';
import { initializeSecurity } from '@/utils/securityHeaders';
import { optimizedSessionManager } from '@/services/optimizedSessionManager';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent, setupCSPViolationReporting } from '@/utils/optimizedSecurityLogger';

interface EnhancedSecurityProviderProps {
  children: ReactNode;
}

export const EnhancedSecurityProvider = ({ children }: EnhancedSecurityProviderProps) => {
  
  // Initialize security monitoring
  const initializeSecurityMonitoring = useCallback(async () => {
    try {
      // Initialize security headers and CSP
      initializeSecurity();
      
      // Set up CSP violation reporting
      setupCSPViolationReporting();
      
      // Set up session management
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await optimizedSessionManager.initializeSession(session.access_token);
        
        // Check for suspicious activity
        const isSuspicious = await optimizedSessionManager.detectSuspiciousActivity(session.access_token);
        if (isSuspicious) {
          await logSecurityEvent('suspicious_activity', {
            reason: 'Multiple concurrent sessions detected',
            sessionId: session.access_token
          });
        }
      }
      
      // Set up periodic session cleanup
      const cleanupInterval = setInterval(() => {
        optimizedSessionManager.cleanupExpiredSessions();
      }, 60 * 60 * 1000); // Every hour
      
      return () => {
        clearInterval(cleanupInterval);
        optimizedSessionManager.stopSessionMonitoring();
      };
      
    } catch (error) {
      console.error('Failed to initialize security monitoring:', error);
      await logSecurityEvent('security_initialization_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);
  
  // Set up throttled security event listeners (performance optimized)
  const setupSecurityListeners = useCallback(() => {
    // Throttled session activity updates
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            optimizedSessionManager.updateActivity(session.access_token);
          }
        });
      }
    };
    
    // Passive, throttled user activity tracking
    const handleUserActivity = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          optimizedSessionManager.updateActivity(session.access_token);
        }
      });
    };
    
    // Listen for beforeunload to log session end
    const handleBeforeUnload = () => {
      logSecurityEvent('session_ending', {
        reason: 'Page unload'
      });
    };
    
    // Add passive event listeners with throttling built into updateActivity
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    document.addEventListener('click', handleUserActivity, { passive: true });
    document.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  useEffect(() => {
    let cleanupSecurity: (() => void) | undefined;
    
    // Initialize security monitoring
    const initSecurity = async () => {
      cleanupSecurity = await initializeSecurityMonitoring();
    };
    initSecurity();
    
    // Setup security event listeners
    const cleanupListeners = setupSecurityListeners();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            await optimizedSessionManager.initializeSession(session.access_token);
            await logSecurityEvent('signin_success', {
              userId: session.user.id,
              sessionId: session.access_token
            });
          }
          break;
          
        case 'SIGNED_OUT':
          optimizedSessionManager.stopSessionMonitoring();
          await logSecurityEvent('signout_success', {
            reason: 'User signed out'
          });
          break;
          
        case 'TOKEN_REFRESHED':
          if (session) {
            optimizedSessionManager.updateActivity(session.access_token);
          }
          break;
      }
    });
    
    // Cleanup function
    return () => {
      if (cleanupSecurity) cleanupSecurity();
      cleanupListeners();
      subscription.unsubscribe();
    };
  }, [initializeSecurityMonitoring, setupSecurityListeners]);

  return <>{children}</>;
};