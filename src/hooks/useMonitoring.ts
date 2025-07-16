// React hooks for the enhanced monitoring service
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MonitoringService, LogContext } from '@/services/monitoringService';
import { 
  authLogger, 
  teamsLogger, 
  contentLogger, 
  adminLogger, 
  performanceLogger 
} from '@/services/logger/domainLoggers';

// Main monitoring hook
export const useMonitoring = (context: LogContext) => {
  const { user } = useAuth();

  const logEvent = useCallback(async (
    event_type: string,
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'critical' = 'info',
    metadata?: Record<string, unknown>
  ) => {
    return MonitoringService.logEvent({
      event_type,
      message,
      level,
      context,
      user_id: user?.id,
      metadata
    });
  }, [context, user?.id]);

  const logError = useCallback(async (
    error: Error,
    showToast = true,
    metadata?: Record<string, unknown>
  ) => {
    return MonitoringService.reportError(error, context, { showToast }, metadata);
  }, [context]);

  const logSuccess = useCallback(async (
    message: string,
    showToast = true,
    metadata?: Record<string, unknown>
  ) => {
    return MonitoringService.logSuccess(message, context, showToast, metadata);
  }, [context]);

  const logUserAction = useCallback(async (
    action: string,
    resource?: string,
    metadata?: Record<string, unknown>
  ) => {
    return MonitoringService.logUserAction(action, context, resource, metadata);
  }, [context]);

  const logPerformance = useCallback(async (
    metric: string,
    value: number,
    metadata?: Record<string, unknown>
  ) => {
    return MonitoringService.logPerformance(metric, value, context, metadata);
  }, [context]);

  return {
    logEvent,
    logError,
    logSuccess,
    logUserAction,
    logPerformance,
    context
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const { logPerformance } = useMonitoring('performance');

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        logPerformance('component_render', renderTime, { componentName });
      }
    };
  }, [componentName, logPerformance]);

  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      await logPerformance(operationName, duration, { success: true, ...metadata });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      await logPerformance(operationName, duration, { success: false, error: (error as Error).message, ...metadata });
      throw error;
    }
  }, [logPerformance]);

  return { measureOperation };
};

// Page tracking hook
export const usePageTracking = (pageName: string) => {
  const { logUserAction } = useMonitoring('system');
  const pageLoadTime = useRef<number>();

  useEffect(() => {
    pageLoadTime.current = performance.now();
    
    logUserAction('page_visit', pageName, {
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    return () => {
      if (pageLoadTime.current) {
        const timeOnPage = performance.now() - pageLoadTime.current;
        performanceLogger.pageLoad(pageName, timeOnPage);
      }
    };
  }, [pageName, logUserAction]);
};

// User journey tracking hook
export const useUserJourney = (context: LogContext) => {
  const { logUserAction } = useMonitoring(context);

  const trackStep = useCallback(async (
    step: string,
    resource?: string,
    metadata?: Record<string, unknown>
  ) => {
    return logUserAction(step, resource, {
      journey_step: step,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [logUserAction]);

  const trackConversion = useCallback(async (
    conversionType: string,
    value?: number,
    metadata?: Record<string, unknown>
  ) => {
    return logUserAction('conversion', conversionType, {
      conversion_type: conversionType,
      value,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [logUserAction]);

  return { trackStep, trackConversion };
};

// Auth-specific monitoring
export const useAuthMonitoring = () => {
  const trackLogin = useCallback(async (email: string) => {
    return authLogger.loginStart(email);
  }, []);

  const trackLoginSuccess = useCallback(async (userId: string) => {
    return authLogger.loginSuccess(userId);
  }, []);

  const trackLoginFailure = useCallback(async (error: Error, email: string) => {
    return authLogger.loginFailure(error, email);
  }, []);

  const trackSignup = useCallback(async (email: string) => {
    return authLogger.signupStart(email);
  }, []);

  const trackSignupSuccess = useCallback(async (userId: string) => {
    return authLogger.signupSuccess(userId);
  }, []);

  const trackSignupFailure = useCallback(async (error: Error, email: string) => {
    return authLogger.signupFailure(error, email);
  }, []);

  const trackPasswordReset = useCallback(async (email: string) => {
    return authLogger.passwordResetRequest(email);
  }, []);

  const trackSignout = useCallback(async () => {
    return authLogger.signoutSuccess();
  }, []);

  return {
    trackLogin,
    trackLoginSuccess,
    trackLoginFailure,
    trackSignup,
    trackSignupSuccess,
    trackSignupFailure,
    trackPasswordReset,
    trackSignout
  };
};

// Teams-specific monitoring
export const useTeamsMonitoring = () => {
  const trackTeamCreated = useCallback(async (teamId: string, teamName: string) => {
    return teamsLogger.teamCreated(teamId, teamName);
  }, []);

  const trackTeamJoined = useCallback(async (teamId: string, teamName: string, role: string) => {
    return teamsLogger.teamJoined(teamId, teamName, role);
  }, []);

  const trackInvitationSent = useCallback(async (teamId: string, email: string, role: string) => {
    return teamsLogger.invitationSent(teamId, email, role);
  }, []);

  const trackMemberRoleChanged = useCallback(async (
    teamId: string, 
    memberId: string, 
    oldRole: string, 
    newRole: string
  ) => {
    return teamsLogger.memberRoleChanged(teamId, memberId, oldRole, newRole);
  }, []);

  const trackMemberRemoved = useCallback(async (teamId: string, memberId: string) => {
    return teamsLogger.memberRemoved(teamId, memberId);
  }, []);

  const trackPermissionDenied = useCallback(async (
    action: string, 
    requiredRole: string, 
    currentRole: string
  ) => {
    return teamsLogger.permissionDenied(action, requiredRole, currentRole);
  }, []);

  return {
    trackTeamCreated,
    trackTeamJoined,
    trackInvitationSent,
    trackMemberRoleChanged,
    trackMemberRemoved,
    trackPermissionDenied
  };
};

// Content-specific monitoring
export const useContentMonitoring = () => {
  const trackContentGenerated = useCallback(async (
    contentType: string, 
    contentId: string, 
    tokensUsed?: number
  ) => {
    return contentLogger.contentGenerated(contentType, contentId, tokensUsed);
  }, []);

  const trackContentDeleted = useCallback(async (contentType: string, contentId: string) => {
    return contentLogger.contentDeleted(contentType, contentId);
  }, []);

  const trackContentExported = useCallback(async (
    contentType: string, 
    contentId: string, 
    format: string
  ) => {
    return contentLogger.contentExported(contentType, contentId, format);
  }, []);

  const trackContentFavorited = useCallback(async (contentId: string, favorited: boolean) => {
    return contentLogger.contentFavorited(contentId, favorited);
  }, []);

  const trackBulkExport = useCallback(async (contentCount: number, format: string) => {
    return contentLogger.bulkExport(contentCount, format);
  }, []);

  const trackGenerationError = useCallback(async (contentType: string, error: Error) => {
    return contentLogger.generationError(contentType, error);
  }, []);

  const trackTemplateUsed = useCallback(async (templateId: string, templateName: string) => {
    return contentLogger.templateUsed(templateId, templateName);
  }, []);

  return {
    trackContentGenerated,
    trackContentDeleted,
    trackContentExported,
    trackContentFavorited,
    trackBulkExport,
    trackGenerationError,
    trackTemplateUsed
  };
};

// Admin-specific monitoring
export const useAdminMonitoring = () => {
  const trackAdminAction = useCallback(async (action: string, targetId?: string) => {
    return adminLogger.adminActionStart(action, targetId);
  }, []);

  const trackAdminSuccess = useCallback(async (action: string, targetId?: string) => {
    return adminLogger.adminActionSuccess(action, targetId);
  }, []);

  const trackAdminFailure = useCallback(async (action: string, error: Error, targetId?: string) => {
    return adminLogger.adminActionFailure(action, error, targetId);
  }, []);

  const trackUserRoleChanged = useCallback(async (
    targetUserId: string, 
    oldRole: string, 
    newRole: string
  ) => {
    return adminLogger.userRoleChanged(targetUserId, oldRole, newRole);
  }, []);

  const trackPlanUpgraded = useCallback(async (
    userId: string, 
    oldPlan: string, 
    newPlan: string
  ) => {
    return adminLogger.planUpgraded(userId, oldPlan, newPlan);
  }, []);

  const trackCreditsReset = useCallback(async (
    userId: string, 
    oldCredits: number, 
    newCredits: number
  ) => {
    return adminLogger.creditsReset(userId, oldCredits, newCredits);
  }, []);

  const trackSecurityEvent = useCallback(async (event: string, details: Record<string, unknown>) => {
    return adminLogger.securityEvent(event, details);
  }, []);

  return {
    trackAdminAction,
    trackAdminSuccess,
    trackAdminFailure,
    trackUserRoleChanged,
    trackPlanUpgraded,
    trackCreditsReset,
    trackSecurityEvent
  };
};

// Error recovery tracking
export const useErrorRecovery = (context: LogContext) => {
  const { logError, logSuccess } = useMonitoring(context);

  const trackError = useCallback(async (
    error: Error,
    recoveryAction?: string,
    metadata?: Record<string, unknown>
  ) => {
    return logError(error, true, {
      recovery_action: recoveryAction,
      ...metadata
    });
  }, [logError]);

  const trackRecoverySuccess = useCallback(async (
    originalError: string,
    recoveryAction: string,
    metadata?: Record<string, unknown>
  ) => {
    return logSuccess(`Recovered from error: ${originalError}`, false, {
      recovery_action: recoveryAction,
      ...metadata
    });
  }, [logSuccess]);

  const trackRecoveryFailure = useCallback(async (
    originalError: string,
    recoveryAction: string,
    newError: Error,
    metadata?: Record<string, unknown>
  ) => {
    return logError(newError, true, {
      original_error: originalError,
      recovery_action: recoveryAction,
      recovery_failed: true,
      ...metadata
    });
  }, [logError]);

  return {
    trackError,
    trackRecoverySuccess,
    trackRecoveryFailure
  };
};