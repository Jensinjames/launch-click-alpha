// Enhanced Security Provider with Session Management
import { useEffect, ReactNode, useCallback } from 'react';
import { initializeSecurity } from '@/utils/securityHeaders';
import { sessionManager } from '@/services/sessionManager';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent, setupCSPViolationReporting } from '@/utils/securityLogger';

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
        await sessionManager.initializeSession(session.access_token);
        
        // Check for suspicious activity
        const isSuspicious = await sessionManager.detectSuspiciousActivity(session.access_token);
        if (isSuspicious) {
          await logSecurityEvent('suspicious_activity', {
            reason: 'Multiple concurrent sessions detected',
            sessionId: session.access_token
          });
        }
      }
      
      // Set up periodic session cleanup
      const cleanupInterval = setInterval(() => {
        sessionManager.cleanupExpiredSessions();
      }, 60 * 60 * 1000); // Every hour
      
      return () => {
        clearInterval(cleanupInterval);
        sessionManager.stopSessionMonitoring();
      };
      
    } catch (error) {
      console.error('Failed to initialize security monitoring:', error);
      await logSecurityEvent('security_initialization_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);
  
  // Set up security event listeners
  const setupSecurityListeners = useCallback(() => {
    // Listen for visibility change to update session activity
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await sessionManager.updateActivity(session.access_token);
        }
      }
    };
    
    // Listen for user activity to update session
    const handleUserActivity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await sessionManager.updateActivity(session.access_token);
      }
    };
    
    // Listen for beforeunload to log session end
    const handleBeforeUnload = () => {
      logSecurityEvent('session_ending', {
        reason: 'Page unload'
      });
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
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
            await sessionManager.initializeSession(session.access_token);
            await logSecurityEvent('signin_success', {
              userId: session.user.id,
              sessionId: session.access_token
            });
          }
          break;
          
        case 'SIGNED_OUT':
          sessionManager.stopSessionMonitoring();
          await logSecurityEvent('signout_success', {
            reason: 'User signed out'
          });
          break;
          
        case 'TOKEN_REFRESHED':
          if (session) {
            await sessionManager.updateActivity(session.access_token);
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