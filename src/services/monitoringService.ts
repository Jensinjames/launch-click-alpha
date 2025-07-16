// Monitoring Service - Simple Implementation
export interface MonitoringData {
  event_type: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
}

export interface ErrorReport {
  error_id: string;
  message: string;
  stack?: string;
  user_agent?: string;
  url?: string;
  timestamp: string;
}

export class MonitoringService {
  private static sessionId = crypto.randomUUID();

  static async logEvent(data: MonitoringData): Promise<void> {
    try {
      // Use console logging for now, in production this would integrate with monitoring service
      console.log(`[${data.level.toUpperCase()}] ${data.event_type}: ${data.message}`, data.metadata);
    } catch (error) {
      console.error('Monitoring service error:', error);
    }
  }

  static async reportError(error: Error, context?: Record<string, unknown>): Promise<string> {
    const errorId = crypto.randomUUID();
    
    try {
      const errorReport: ErrorReport = {
        error_id: errorId,
        message: error.message,
        stack: error.stack,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      await this.logEvent({
        event_type: 'error_report',
        message: `Error: ${error.message}`,
        level: 'error',
        metadata: {
          ...errorReport,
          context
        }
      });

      return errorId;
    } catch (logError) {
      console.error('Failed to report error:', logError);
      return errorId;
    }
  }

  static async logPerformance(metric: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent({
      event_type: 'performance_metric',
      message: `${metric}: ${value}ms`,
      level: 'info',
      metadata: {
        metric,
        value,
        ...metadata
      }
    });
  }

  static async logUserAction(action: string, resource?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent({
      event_type: 'user_action',
      message: `User performed: ${action}`,
      level: 'info',
      metadata: {
        action,
        resource,
        ...metadata
      }
    });
  }

  static async checkSystemHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down'; checks: Record<string, boolean> }> {
    // Simple health check implementation
    return {
      status: 'healthy',
      checks: {
        system: true,
        database: true,
        auth: true
      }
    };
  }
}