
import { AuthService } from '@/services/authService';

export type SecurityEventType = 
  | 'signup_attempt'
  | 'signup_success'
  | 'signup_failed'
  | 'signin_attempt'
  | 'signin_success'
  | 'signin_failed'
  | 'signout_attempt'
  | 'signout_success'
  | 'signout_failed'
  | 'resend_confirmation_attempt'
  | 'resend_confirmation_success'
  | 'resend_confirmation_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'admin_access_attempt'
  | 'admin_access_granted'
  | 'admin_access_denied';

export interface SecurityEventData {
  email?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export const logSecurityEvent = async (
  eventType: SecurityEventType, 
  eventData: SecurityEventData = {}
): Promise<void> => {
  try {
    // Enrich event data with browser information
    const enrichedData = {
      ...eventData,
      timestamp: new Date().toISOString(),
      userAgent: eventData.userAgent || navigator.userAgent,
      url: window.location.href,
      // Note: IP address would be detected server-side
    };

    await AuthService.logSecurityEvent(eventType, enrichedData);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Security] ${eventType}:`, enrichedData);
    }
  } catch (error) {
    // Silently fail security logging to not disrupt user flow
    if (import.meta.env.DEV) {
      console.warn('Failed to log security event:', error);
    }
  }
};

export const logRateLimitExceeded = (identifier: string, attemptCount: number) => {
  logSecurityEvent('rate_limit_exceeded', {
    email: identifier,
    metadata: { attemptCount }
  });
};

export const logSuspiciousActivity = (reason: string, eventData: SecurityEventData = {}) => {
  logSecurityEvent('suspicious_activity', {
    ...eventData,
    metadata: { reason, ...eventData.metadata }
  });
};
