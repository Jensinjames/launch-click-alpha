// Optimized Security Logging with Batching and Smart Caching
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
  url?: string;
  fingerprint?: string;
  metadata?: Record<string, any>;
}

interface QueuedEvent {
  eventType: SecurityEventType;
  eventData: SecurityEventData;
  timestamp: number;
  isCritical: boolean;
}

// Define critical events that require immediate attention and full fingerprinting
const CRITICAL_EVENTS: Set<SecurityEventType> = new Set([
  'admin_access_attempt',
  'admin_access_denied',
  'suspicious_activity',
  'suspicious_multiple_sessions',
  'suspicious_rapid_sessions',
  'rate_limit_exceeded',
  'unauthorized_api_call',
  'csp_violation'
]);

// Events to log in production (filtered for performance)
const PRODUCTION_EVENTS: Set<SecurityEventType> = new Set([
  'signup_failed',
  'signin_failed',
  'admin_access_attempt',
  'admin_access_denied',
  'suspicious_activity',
  'suspicious_multiple_sessions',
  'suspicious_rapid_sessions',
  'rate_limit_exceeded',
  'unauthorized_api_call',
  'csp_violation',
  'session_expired'
]);

class OptimizedSecurityLogger {
  private eventQueue: QueuedEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sessionCorrelationId: string | null = null;
  private cachedFingerprint: string | null = null;
  private fingerprintWorker: Worker | null = null;
  
  private readonly BATCH_INTERVAL = 10 * 1000; // 10 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly CORRELATION_CACHE_KEY = 'security_correlation_id';
  
  constructor() {
    this.loadCachedCorrelationId();
    this.initializeOptimizedWorker();
    this.startBatchTimer();
  }

  // Load cached correlation ID for session reuse
  private loadCachedCorrelationId(): void {
    try {
      const cached = sessionStorage.getItem(this.CORRELATION_CACHE_KEY);
      if (cached) {
        const { correlationId, timestamp } = JSON.parse(cached);
        // Reuse correlation ID if less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          this.sessionCorrelationId = correlationId;
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached correlation ID:', error);
    }
    
    // Generate new correlation ID
    this.generateNewCorrelationId();
  }

  private generateNewCorrelationId(): void {
    this.sessionCorrelationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      sessionStorage.setItem(this.CORRELATION_CACHE_KEY, JSON.stringify({
        correlationId: this.sessionCorrelationId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache correlation ID:', error);
    }
  }

  // Initialize lightweight worker for critical events only
  private initializeOptimizedWorker(): void {
    try {
      const workerBlob = new Blob([`
        // Lightweight fingerprint for critical events only
        self.onmessage = async function(e) {
          const { type } = e.data;
          
          if (type === 'generateCriticalFingerprint') {
            try {
              // Minimal fingerprint for critical events
              const fingerprint = [
                self.navigator.userAgent.slice(0, 50), // Truncated UA
                self.navigator.language,
                self.screen.width + 'x' + self.screen.height,
                new Date().getTimezoneOffset().toString()
              ].join('|');
              
              // Simple hash without canvas
              const encoder = new TextEncoder();
              const data = encoder.encode(fingerprint);
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
              
              self.postMessage({ 
                type: 'criticalFingerprintGenerated', 
                fingerprint: hash 
              });
            } catch (error) {
              self.postMessage({ 
                type: 'fingerprintError', 
                error: 'Failed to generate critical fingerprint' 
              });
            }
          }
        };
      `], { type: 'application/javascript' });
      
      this.fingerprintWorker = new Worker(URL.createObjectURL(workerBlob));
      this.fingerprintWorker.onmessage = this.handleWorkerMessage.bind(this);
    } catch (error) {
      console.warn('Failed to initialize optimized worker:', error);
    }
  }

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type, fingerprint } = e.data;
    
    if (type === 'criticalFingerprintGenerated') {
      this.cachedFingerprint = fingerprint;
    }
  };

  // Check if event should be logged based on environment and criticality
  private shouldLogEvent(eventType: SecurityEventType): boolean {
    if (import.meta.env.DEV) {
      return true; // Log all events in development
    }
    
    // In production, only log critical and selected events
    return PRODUCTION_EVENTS.has(eventType);
  }

  // Determine if event is critical and needs immediate processing
  private isCriticalEvent(eventType: SecurityEventType): boolean {
    return CRITICAL_EVENTS.has(eventType);
  }

  // Main logging function with batching
  public logSecurityEvent = (
    eventType: SecurityEventType,
    eventData: SecurityEventData = {}
  ): void => {
    // Filter events based on environment and criticality
    if (!this.shouldLogEvent(eventType)) {
      return;
    }

    const isCritical = this.isCriticalEvent(eventType);
    
    // For critical events, generate fingerprint if not cached
    if (isCritical && !this.cachedFingerprint && this.fingerprintWorker) {
      this.fingerprintWorker.postMessage({ type: 'generateCriticalFingerprint' });
    }

    // Enrich event data with cached values
    const enrichedData: SecurityEventData = {
      ...eventData,
      correlationId: eventData.correlationId || this.sessionCorrelationId,
      userAgent: eventData.userAgent || navigator.userAgent.slice(0, 100), // Truncated UA
      url: window.location.href,
      // Only add fingerprint for critical events
      ...(isCritical && this.cachedFingerprint && { fingerprint: this.cachedFingerprint })
    };

    // Add to queue
    const queuedEvent: QueuedEvent = {
      eventType,
      eventData: enrichedData,
      timestamp: Date.now(),
      isCritical
    };

    this.eventQueue.push(queuedEvent);

    // Prevent queue overflow
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    // For critical events, process immediately
    if (isCritical) {
      this.processCriticalEvent(queuedEvent);
    }

    // Log to console in development only
    if (import.meta.env.DEV) {
      console.log(`[Security-Queued] ${eventType}:`, enrichedData);
    }
  };

  // Process critical events immediately
  private async processCriticalEvent(event: QueuedEvent): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        event_type: event.eventType,
        event_data: {
          ...event.eventData,
          timestamp: new Date(event.timestamp).toISOString(),
          priority: 'critical'
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to log critical security event:', error);
      }
    }
  }

  // Start batch processing timer
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.BATCH_INTERVAL);
  }

  // Process batched events
  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    // Get non-critical events for batching
    const batchEvents = this.eventQueue.filter(event => !event.isCritical);
    
    if (batchEvents.length === 0) {
      // Remove critical events that were already processed
      this.eventQueue = this.eventQueue.filter(event => !event.isCritical);
      return;
    }

    try {
      // Batch insert events
      const batchData = batchEvents.map(event => ({
        event_type: event.eventType,
        event_data: {
          ...event.eventData,
          timestamp: new Date(event.timestamp).toISOString(),
          priority: 'batch'
        }
      }));

      // Use batch insert for better performance
      for (const data of batchData) {
        await supabase.rpc('log_security_event', data);
      }

      // Remove processed events from queue
      this.eventQueue = this.eventQueue.filter(event => event.isCritical);

      if (import.meta.env.DEV) {
        console.log(`[Security-Batch] Processed ${batchData.length} events`);
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to process security event batch:', error);
      }
      // On error, clear old events to prevent memory buildup
      this.eventQueue = this.eventQueue.filter(event => 
        event.isCritical || Date.now() - event.timestamp < 60000
      );
    }
  }

  // Optimized helper functions
  public logRateLimitExceeded = (identifier: string, attemptCount: number): void => {
    this.logSecurityEvent('rate_limit_exceeded', {
      email: identifier,
      metadata: { attemptCount }
    });
  };

  public logSuspiciousActivity = (reason: string, eventData: SecurityEventData = {}): void => {
    this.logSecurityEvent('suspicious_activity', {
      ...eventData,
      metadata: { reason, ...eventData.metadata }
    });
  };

  // Setup optimized CSP violation reporting
  public setupOptimizedCSPReporting = (): void => {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.logSecurityEvent('csp_violation', {
        metadata: {
          directive: e.violatedDirective,
          blockedURI: e.blockedURI?.slice(0, 100), // Truncated URI
          documentURI: e.documentURI?.slice(0, 100),
          sourceFile: e.sourceFile?.slice(0, 100),
          lineNumber: e.lineNumber
        }
      });
    }, { passive: true });
  };

  // Cleanup method
  public cleanup = (): void => {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.fingerprintWorker) {
      this.fingerprintWorker.terminate();
      this.fingerprintWorker = null;
    }

    // Process any remaining events
    if (this.eventQueue.length > 0) {
      this.processBatch();
    }
  };

  // Force flush for testing or critical situations
  public flush = async (): Promise<void> => {
    await this.processBatch();
  };
}

// Singleton instance
export const optimizedSecurityLogger = new OptimizedSecurityLogger();

// Export optimized functions
export const logSecurityEvent = optimizedSecurityLogger.logSecurityEvent;
export const logRateLimitExceeded = optimizedSecurityLogger.logRateLimitExceeded;
export const logSuspiciousActivity = optimizedSecurityLogger.logSuspiciousActivity;
export const setupCSPViolationReporting = optimizedSecurityLogger.setupOptimizedCSPReporting;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  optimizedSecurityLogger.cleanup();
});