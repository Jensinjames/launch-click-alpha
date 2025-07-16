// Enhanced Notification Service with Smart User Feedback
import { toast } from 'sonner';
import { MonitoringService, LogContext } from './monitoringService';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onAutoClose?: () => void;
  onDismiss?: () => void;
}

export interface ProgressNotificationOptions extends NotificationOptions {
  steps?: string[];
  currentStep?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface ErrorNotificationOptions extends NotificationOptions {
  includeErrorId?: boolean;
  includeReportAction?: boolean;
  suggestedAction?: string;
  recoveryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

class NotificationService {
  private static instance: NotificationService;
  private activeNotifications = new Map<string, any>();
  private notificationHistory: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    context: LogContext;
  }> = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Success notifications with context awareness
  async showSuccess(
    message: string,
    context: LogContext,
    options: NotificationOptions = {}
  ): Promise<string> {
    const notificationId = this.generateId();
    
    const toastId = toast.success(message, {
      duration: options.duration || 4000,
      position: options.position,
      dismissible: options.dismissible,
      action: options.action,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss
    });

    await this.logNotification(notificationId, 'success', message, context);
    this.activeNotifications.set(notificationId, toastId);
    
    return notificationId;
  }

  // Error notifications with recovery options
  async showError(
    error: Error | string,
    context: LogContext,
    options: ErrorNotificationOptions = {}
  ): Promise<string> {
    const notificationId = this.generateId();
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    let displayMessage = errorMessage;
    
    // Add contextual help based on error patterns
    const contextualHelp = this.getContextualHelp(errorMessage, context);
    if (contextualHelp) {
      displayMessage = `${errorMessage}\n\n${contextualHelp}`;
    }

    const actions = [];
    
    // Add recovery actions if provided
    if (options.recoveryActions) {
      actions.push(...options.recoveryActions);
    }
    
    // Add report action if requested
    if (options.includeReportAction) {
      actions.push({
        label: 'Report Issue',
        onClick: () => this.reportIssue(error, context)
      });
    }

    const toastId = toast.error(displayMessage, {
      duration: options.duration || 8000,
      position: options.position,
      dismissible: options.dismissible,
      action: actions.length > 0 ? actions[0] : options.action,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss
    });

    // Log error to monitoring service
    if (typeof error !== 'string') {
      await MonitoringService.reportError(error, context, { showToast: false });
    }

    await this.logNotification(notificationId, 'error', errorMessage, context);
    this.activeNotifications.set(notificationId, toastId);
    
    return notificationId;
  }

  // Info notifications
  async showInfo(
    message: string,
    context: LogContext,
    options: NotificationOptions = {}
  ): Promise<string> {
    const notificationId = this.generateId();
    
    const toastId = toast.info(message, {
      duration: options.duration || 6000,
      position: options.position,
      dismissible: options.dismissible,
      action: options.action,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss
    });

    await this.logNotification(notificationId, 'info', message, context);
    this.activeNotifications.set(notificationId, toastId);
    
    return notificationId;
  }

  // Warning notifications
  async showWarning(
    message: string,
    context: LogContext,
    options: NotificationOptions = {}
  ): Promise<string> {
    const notificationId = this.generateId();
    
    const toastId = toast.warning(message, {
      duration: options.duration || 7000,
      position: options.position,
      dismissible: options.dismissible,
      action: options.action,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss
    });

    await this.logNotification(notificationId, 'warning', message, context);
    this.activeNotifications.set(notificationId, toastId);
    
    return notificationId;
  }

  // Progress notifications for long-running operations
  async showProgress(
    message: string,
    context: LogContext,
    options: ProgressNotificationOptions = {}
  ): Promise<{
    id: string;
    updateProgress: (step: number, message?: string) => void;
    complete: (message?: string) => void;
    fail: (error: Error | string) => void;
  }> {
    const notificationId = this.generateId();
    let currentToastId: any;
    
    const updateProgress = (step: number, newMessage?: string) => {
      if (currentToastId) {
        toast.dismiss(currentToastId);
      }
      
      const progressMessage = newMessage || message;
      const stepInfo = options.steps ? ` (${step}/${options.steps.length})` : '';
      
      currentToastId = toast.loading(`${progressMessage}${stepInfo}`, {
        duration: Infinity,
        action: options.onCancel ? {
          label: 'Cancel',
          onClick: options.onCancel
        } : undefined
      });
    };

    const complete = (successMessage?: string) => {
      if (currentToastId) {
        toast.dismiss(currentToastId);
      }
      
      toast.success(successMessage || 'Operation completed successfully', {
        duration: 4000
      });
      
      options.onComplete?.();
      this.activeNotifications.delete(notificationId);
    };

    const fail = (error: Error | string) => {
      if (currentToastId) {
        toast.dismiss(currentToastId);
      }
      
      const errorMessage = typeof error === 'string' ? error : error.message;
      toast.error(`Operation failed: ${errorMessage}`, {
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => {
            // Emit retry event
            MonitoringService.logEvent({
              event_type: 'operation_retry',
              message: 'User requested retry after failure',
              level: 'info',
              context,
              metadata: { original_error: errorMessage }
            });
          }
        }
      });
      
      this.activeNotifications.delete(notificationId);
    };

    // Initialize progress
    updateProgress(0);
    
    await this.logNotification(notificationId, 'progress', message, context);
    this.activeNotifications.set(notificationId, currentToastId);
    
    return {
      id: notificationId,
      updateProgress,
      complete,
      fail
    };
  }

  // Batch notifications for multiple operations
  async showBatch(
    operations: Array<{
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      context: LogContext;
      options?: NotificationOptions;
    }>
  ): Promise<string[]> {
    const notificationIds: string[] = [];
    
    for (const op of operations) {
      let id: string;
      
      switch (op.type) {
        case 'success':
          id = await this.showSuccess(op.message, op.context, op.options);
          break;
        case 'error':
          id = await this.showError(op.message, op.context, op.options);
          break;
        case 'info':
          id = await this.showInfo(op.message, op.context, op.options);
          break;
        case 'warning':
          id = await this.showWarning(op.message, op.context, op.options);
          break;
        default:
          id = await this.showInfo(op.message, op.context, op.options);
      }
      
      notificationIds.push(id);
    }
    
    return notificationIds;
  }

  // Dismiss notification
  dismissNotification(notificationId: string): void {
    const toastId = this.activeNotifications.get(notificationId);
    if (toastId) {
      toast.dismiss(toastId);
      this.activeNotifications.delete(notificationId);
    }
  }

  // Dismiss all notifications
  dismissAll(): void {
    this.activeNotifications.forEach((toastId) => {
      toast.dismiss(toastId);
    });
    this.activeNotifications.clear();
  }

  // Get notification history
  getHistory(): Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    context: LogContext;
  }> {
    return [...this.notificationHistory];
  }

  // Clear notification history
  clearHistory(): void {
    this.notificationHistory = [];
  }

  // Private methods
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logNotification(
    id: string,
    type: string,
    message: string,
    context: LogContext
  ): Promise<void> {
    this.notificationHistory.unshift({
      id,
      type,
      message,
      timestamp: new Date(),
      context
    });

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    // Log to monitoring service
    await MonitoringService.logEvent({
      event_type: 'notification_shown',
      message: `Notification displayed: ${message}`,
      level: 'info',
      context,
      metadata: { notification_id: id, notification_type: type }
    });
  }

  private getContextualHelp(errorMessage: string, context: LogContext): string | null {
    const helpMap: Record<LogContext, Record<string, string>> = {
      auth: {
        'Invalid credentials': 'Please check your email and password. If you forgot your password, use the reset link.',
        'Network Error': 'Please check your internet connection and try again.',
        'User not found': 'This email address is not registered. Please check the email or sign up for a new account.'
      },
      teams: {
        'Permission denied': 'You need admin or owner permissions to perform this action.',
        'Team not found': 'The team may have been deleted or you may have lost access.',
        'Invitation expired': 'Please request a new invitation from your team administrator.'
      },
      content: {
        'Generation failed': 'Please try again. If the problem persists, check your internet connection.',
        'Quota exceeded': 'You have reached your content generation limit. Consider upgrading your plan.',
        'Export failed': 'Please try exporting again. Large exports may take more time.'
      },
      admin: {
        'Unauthorized': 'You need admin privileges to access this feature.',
        'Operation failed': 'This admin operation failed. Please try again or contact support.'
      },
      performance: {
        'Slow response': 'The system is experiencing high load. Please try again in a moment.',
        'Timeout': 'The operation took too long. Please try again with a smaller request.'
      },
      system: {
        'Service unavailable': 'The system is temporarily unavailable. Please try again in a few minutes.',
        'Unexpected error': 'An unexpected error occurred. Please refresh the page and try again.'
      }
    };

    const contextHelp = helpMap[context];
    if (!contextHelp) return null;

    for (const [errorPattern, help] of Object.entries(contextHelp)) {
      if (errorMessage.toLowerCase().includes(errorPattern.toLowerCase())) {
        return help;
      }
    }

    return null;
  }

  private async reportIssue(error: Error | string, context: LogContext): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    await MonitoringService.logEvent({
      event_type: 'issue_reported',
      message: `User reported issue: ${errorMessage}`,
      level: 'warning',
      context,
      metadata: {
        error_message: errorMessage,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });

    toast.success('Issue reported successfully. Our team will investigate.');
  }
}

export const notificationService = NotificationService.getInstance();
