// Monitoring Service - Complete Implementation
import { supabase } from "@/integrations/supabase/client";

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
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: 'monitoring_event',
          table_name: data.event_type,
          new_values: JSON.parse(JSON.stringify({
            level: data.level,
            message: data.message,
            metadata: data.metadata || {},
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
          })),
          user_id: data.user_id
        });

      if (error) {
        console.error('Failed to log monitoring event:', error);
      }
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
    const checks: Record<string, boolean> = {};
    
    try {
      // Database connectivity check
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      checks.database = !dbError;

      // Auth service check
      const { data: authData } = await supabase.auth.getSession();
      checks.auth = authData !== null;

      // Storage check (optional)
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        checks.storage = buckets !== null;
      } catch {
        checks.storage = false;
      }

      const allHealthy = Object.values(checks).every(check => check);
      const anyUnhealthy = Object.values(checks).some(check => !check);

      return {
        status: allHealthy ? 'healthy' : anyUnhealthy ? 'degraded' : 'down',
        checks
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'down',
        checks: { ...checks, system: false }
      };
    }
  }
}