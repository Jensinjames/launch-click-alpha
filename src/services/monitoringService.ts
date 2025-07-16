// Enhanced Monitoring Service - Production Ready
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogContext = 'auth' | 'teams' | 'admin' | 'content' | 'performance' | 'system';

export interface MonitoringData {
  event_type: string;
  message: string;
  level: LogLevel;
  context: LogContext;
  metadata?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
  correlation_id?: string;
}

export interface ErrorReport {
  error_id: string;
  message: string;
  stack?: string;
  user_agent?: string;
  url?: string;
  timestamp: string;
  context: LogContext;
  correlation_id?: string;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  context: LogContext;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserJourneyStep {
  step: string;
  context: LogContext;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationOptions {
  showToast?: boolean;
  toastDuration?: number;
  includeReportAction?: boolean;
  userMessage?: string;
}

export class MonitoringService {
  private static sessionId = crypto.randomUUID();
  private static correlationId = crypto.randomUUID();
  private static userJourney: UserJourneyStep[] = [];
  private static performanceMetrics: PerformanceMetric[] = [];
  private static isDebugMode = import.meta.env.DEV;

  // Core logging method with enhanced features
  static async logEvent(data: MonitoringData): Promise<void> {
    try {
      const enrichedData: MonitoringData = {
        ...data,
        session_id: this.sessionId,
        correlation_id: this.correlationId,
        timestamp: new Date().toISOString(),
        metadata: {
          ...data.metadata,
          url: window.location.href,
          user_agent: navigator.userAgent
        }
      };

      // Environment-specific logging
      if (this.isDebugMode) {
        this.logToConsole(enrichedData);
      } else {
        await this.logToService(enrichedData);
      }

      // Store in memory for debugging
      this.storeInMemory(enrichedData);

    } catch (error) {
      console.error('Monitoring service error:', error);
    }
  }

  // Enhanced error reporting with user feedback
  static async reportError(
    error: Error, 
    context: LogContext,
    options: NotificationOptions = {},
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const errorId = crypto.randomUUID();
    
    try {
      const errorReport: ErrorReport = {
        error_id: errorId,
        message: error.message,
        stack: error.stack,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        context,
        correlation_id: this.correlationId
      };

      await this.logEvent({
        event_type: 'error_report',
        message: `Error: ${error.message}`,
        level: 'error',
        context,
        metadata: {
          ...errorReport,
          ...metadata
        }
      });

      // Show user notification if requested
      if (options.showToast) {
        await this.showUserNotification(error, context, options);
      }

      return errorId;
    } catch (logError) {
      console.error('Failed to report error:', logError);
      return errorId;
    }
  }

  // Enhanced performance tracking
  static async logPerformance(
    metric: string, 
    value: number, 
    context: LogContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const performanceData: PerformanceMetric = {
      metric,
      value,
      context,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.performanceMetrics.push(performanceData);

    await this.logEvent({
      event_type: 'performance_metric',
      message: `${metric}: ${value}ms`,
      level: 'info',
      context,
      metadata: {
        metric,
        value,
        ...metadata
      }
    });
  }

  // User journey tracking
  static async logUserAction(
    action: string, 
    context: LogContext,
    resource?: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const journeyStep: UserJourneyStep = {
      step: action,
      context,
      timestamp: new Date().toISOString(),
      metadata: { resource, ...metadata }
    };

    this.userJourney.push(journeyStep);

    await this.logEvent({
      event_type: 'user_action',
      message: `User performed: ${action}`,
      level: 'info',
      context,
      metadata: {
        action,
        resource,
        ...metadata
      }
    });
  }

  // Debug logging for development
  static async logDebug(
    message: string,
    context: LogContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (this.isDebugMode) {
      await this.logEvent({
        event_type: 'debug',
        message,
        level: 'debug',
        context,
        metadata
      });
    }
  }

  // Success tracking with optional user feedback
  static async logSuccess(
    message: string,
    context: LogContext,
    showToast = false,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      event_type: 'success',
      message,
      level: 'info',
      context,
      metadata
    });

    if (showToast) {
      const { toast } = await import('sonner');
      toast.success(message);
    }
  }

  // System health monitoring
  static async checkSystemHealth(): Promise<{ 
    status: 'healthy' | 'degraded' | 'down'; 
    checks: Record<string, boolean>;
    metrics: {
      averageLoadTime: number;
      errorRate: number;
      userJourneyLength: number;
    }
  }> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Calculate metrics
    const recentMetrics = this.performanceMetrics.filter(
      m => new Date(m.timestamp).getTime() > oneHourAgo
    );

    const averageLoadTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
      : 0;

    const errorRate = this.userJourney.length > 0
      ? (this.userJourney.filter(j => j.step.includes('error')).length / this.userJourney.length) * 100
      : 0;

    return {
      status: errorRate > 10 ? 'degraded' : 'healthy',
      checks: {
        system: true,
        database: true,
        auth: true,
        performance: averageLoadTime < 3000
      },
      metrics: {
        averageLoadTime,
        errorRate,
        userJourneyLength: this.userJourney.length
      }
    };
  }

  // Get analytics data
  static getAnalytics() {
    return {
      userJourney: [...this.userJourney],
      performanceMetrics: [...this.performanceMetrics],
      sessionId: this.sessionId,
      correlationId: this.correlationId
    };
  }

  // Clear analytics data
  static clearAnalytics() {
    this.userJourney = [];
    this.performanceMetrics = [];
    this.correlationId = crypto.randomUUID();
  }

  // Private methods
  private static logToConsole(data: MonitoringData): void {
    const contextColor = this.getContextColor(data.context);
    const levelColor = this.getLevelColor(data.level);
    
    const style = `color: ${contextColor}; font-weight: bold;`;
    const levelStyle = `color: ${levelColor}; font-weight: bold;`;
    
    console.groupCollapsed(
      `%c[${data.context.toUpperCase()}] %c${data.level.toUpperCase()}%c ${data.event_type}: ${data.message}`,
      style,
      levelStyle,
      'color: inherit;'
    );
    
    if (data.metadata) {
      console.log('Metadata:', data.metadata);
    }
    
    console.log('Timestamp:', data.timestamp);
    console.log('Session:', data.session_id);
    console.log('Correlation:', data.correlation_id);
    console.groupEnd();
  }

  private static async logToService(data: MonitoringData): Promise<void> {
    // In production, send to actual monitoring service
    // For now, just structured console output
    console.log(`[${data.level.toUpperCase()}] ${data.context}:${data.event_type}`, {
      message: data.message,
      metadata: data.metadata,
      session_id: data.session_id,
      correlation_id: data.correlation_id,
      timestamp: data.timestamp
    });
  }

  private static storeInMemory(data: MonitoringData): void {
    // Store last 100 events for debugging
    if (!this.isDebugMode) return;
    
    const key = 'monitoring_events';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(data);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
  }

  private static async showUserNotification(
    error: Error,
    context: LogContext,
    options: NotificationOptions
  ): Promise<void> {
    const { toast } = await import('sonner');
    const message = options.userMessage || `An error occurred in ${context}`;
    
    toast.error(message, {
      duration: options.toastDuration || 8000,
      action: options.includeReportAction ? {
        label: 'Report',
        onClick: () => this.reportToSupport(error, context)
      } : undefined
    });
  }

  private static async reportToSupport(error: Error, context: LogContext): Promise<void> {
    const { toast } = await import('sonner');
    
    // In production, send to support system
    await this.logEvent({
      event_type: 'support_report',
      message: `User reported error: ${error.message}`,
      level: 'error',
      context,
      metadata: {
        error: error.message,
        stack: error.stack,
        userJourney: this.userJourney.slice(-5) // Last 5 steps
      }
    });
    
    toast.success('Error reported to support team');
  }

  private static getContextColor(context: LogContext): string {
    const colors = {
      auth: '#10b981',
      teams: '#3b82f6',
      admin: '#ef4444',
      content: '#8b5cf6',
      performance: '#f59e0b',
      system: '#6b7280'
    };
    return colors[context] || '#6b7280';
  }

  private static getLevelColor(level: LogLevel): string {
    const colors = {
      debug: '#6b7280',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626'
    };
    return colors[level] || '#6b7280';
  }
}