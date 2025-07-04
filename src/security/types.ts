// Unified Security Types
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
  | 'admin_access_attempt'
  | 'admin_access_granted'
  | 'admin_access_denied'
  | 'admin_validation_error'
  | 'admin_validation_exception'
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
  url?: string;
  lastSignIn?: string;
  timeDiff?: number;
  metadata?: Record<string, any>;
}

export interface RateLimitState {
  count: number;
  lastAttempt: number;
}