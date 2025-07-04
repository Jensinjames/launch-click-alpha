// Unified Security Logger - Simple, Non-Recursive
import { supabase } from '@/integrations/supabase/client';
import type { SecurityEventType, SecurityEventData } from './types';

// Simple correlation ID generation
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Main security logging function - simplified to prevent recursion
export const logSecurityEvent = async (
  eventType: SecurityEventType,
  eventData: SecurityEventData = {}
): Promise<void> => {
  try {
    const enrichedData = {
      ...eventData,
      correlationId: eventData.correlationId || generateCorrelationId(),
      timestamp: new Date().toISOString(),
      userAgent: eventData.userAgent || navigator.userAgent.slice(0, 100), // Truncated
      url: eventData.url || window.location.href,
    };

    // Simple, direct RPC call without complex batching
    await supabase.rpc('log_security_event', {
      event_type: eventType,
      event_data: enrichedData
    });
    
    // Log to console in development only
    if (import.meta.env.DEV) {
      console.log(`[Security] ${eventType}:`, enrichedData);
    }
  } catch (error) {
    // Silently fail to prevent disrupting user flow
    if (import.meta.env.DEV) {
      console.warn('Failed to log security event:', error);
    }
  }
};

// Specific logging helpers
export const logRateLimitExceeded = (identifier: string, attemptCount: number): void => {
  logSecurityEvent('rate_limit_exceeded', {
    email: identifier,
    metadata: { attemptCount }
  });
};

export const logSuspiciousActivity = (reason: string, eventData: SecurityEventData = {}): void => {
  logSecurityEvent('suspicious_activity', {
    ...eventData,
    metadata: { reason, ...eventData.metadata }
  });
};

// Simple CSP violation reporting
export const setupCSPViolationReporting = (): void => {
  document.addEventListener('securitypolicyviolation', (e) => {
    logSecurityEvent('csp_violation', {
      metadata: {
        directive: e.violatedDirective,
        blockedURI: e.blockedURI?.slice(0, 100), // Truncated
        documentURI: e.documentURI?.slice(0, 100),
        sourceFile: e.sourceFile?.slice(0, 100),
        lineNumber: e.lineNumber
      }
    });
  }, { passive: true });
};

// Sanitize error messages to prevent information disclosure
export const sanitizeError = (error: unknown): string => {
  if (import.meta.env.DEV) {
    return error instanceof Error ? error.message : String(error);
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for patterns that should be sanitized
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