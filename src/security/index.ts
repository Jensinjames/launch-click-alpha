// Unified Security Module - Main Exports
// This consolidates all security functionality into a single, cohesive module

// Types
export type { SecurityEventType, SecurityEventData, RateLimitState } from './types';

// Logger functions
export {
  logSecurityEvent,
  logRateLimitExceeded,
  logSuspiciousActivity,
  setupCSPViolationReporting,
  sanitizeError,
  generateCorrelationId
} from './logger';

// Auth functions
export {
  checkServerRateLimit,
  isRateLimited,
  recordAttempt,
  sanitizeInput,
  validateEmail,
  validatePassword,
  validateAdminAccess,
  validateAdminAccessEnhanced
} from './auth';

// Session functions
export {
  unifiedSessionManager,
  initializeSession,
  updateSessionActivity,
  cleanupExpiredSessions,
  detectSuspiciousActivity,
  stopSessionMonitoring
} from './session';

// Re-export common types for convenience
export type { SessionInfo } from './session';