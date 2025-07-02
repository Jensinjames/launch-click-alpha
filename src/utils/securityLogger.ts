// Enhanced Security Logging Utility
import { supabase } from '@/integrations/supabase/client';

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
  | 'admin_access_attempt'
  | 'admin_access_granted'
  | 'admin_access_denied'
  | 'admin_validation_error'
  | 'admin_session_expired'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'csp_violation'
  | 'feature_access_denied'
  | 'unauthorized_api_call'
  | 'session_initialized'
  | 'session_expired'
  | 'other_sessions_terminated'
  | 'suspicious_multiple_sessions'
  | 'suspicious_rapid_sessions'
  | 'security_initialization_failed'
  | 'session_ending';

export interface SecurityEventData {
  email?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  error?: string;
  correlationId?: string;
  requireRecentAuth?: boolean;
  sensitiveOperation?: string;
  reason?: string;
  sessionId?: string;
  currentSessionId?: string;
  sessionCount?: number;
  recentSessionCount?: number;
  metadata?: Record<string, any>;
}

// Generate correlation ID for tracking related events
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced security logging with correlation IDs and structured data
export const logSecurityEvent = async (
  eventType: SecurityEventType,
  eventData: SecurityEventData = {}
): Promise<void> => {
  try {
    const correlationId = eventData.correlationId || generateCorrelationId();
    
    // Enrich event data with browser and security context
    const enrichedData = {
      ...eventData,
      correlationId,
      timestamp: new Date().toISOString(),
      userAgent: eventData.userAgent || navigator.userAgent,
      url: window.location.href,
      sessionId: await getSessionFingerprint(),
      // Note: IP address would be detected server-side in edge functions
    };

    await supabase.rpc('log_security_event', {
      event_type: eventType,
      event_data: enrichedData
    });
    
    // Log to console in development only
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

// Generate session fingerprint for additional security
const getSessionFingerprint = async (): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    return 'unknown';
  }
};

// Log rate limit exceeded events
export const logRateLimitExceeded = (identifier: string, attemptCount: number) => {
  logSecurityEvent('rate_limit_exceeded', {
    email: identifier,
    metadata: { attemptCount }
  });
};

// Log suspicious activity
export const logSuspiciousActivity = (reason: string, eventData: SecurityEventData = {}) => {
  logSecurityEvent('suspicious_activity', {
    ...eventData,
    metadata: { reason, ...eventData.metadata }
  });
};

// CSP violation reporter
export const setupCSPViolationReporting = () => {
  document.addEventListener('securitypolicyviolation', (e) => {
    logSecurityEvent('csp_violation', {
      metadata: {
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        documentURI: e.documentURI,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber
      }
    });
  });
};

// Sanitize error messages to prevent information disclosure
export const sanitizeError = (error: unknown): string => {
  if (import.meta.env.DEV) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // In production, return generic error messages
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for common patterns that should be sanitized
  if (errorMessage.includes('password') || 
      errorMessage.includes('token') ||
      errorMessage.includes('key') ||
      errorMessage.includes('secret')) {
    return 'Authentication error occurred';
  }
  
  if (errorMessage.includes('database') || 
      errorMessage.includes('SQL') ||
      errorMessage.includes('connection')) {
    return 'Service temporarily unavailable';
  }
  
  return 'An error occurred. Please try again.';
};