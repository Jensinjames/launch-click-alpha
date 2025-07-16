import { useCallback } from 'react';
import { toast } from 'sonner';
import { errorService, ErrorType, ErrorSeverity, AppError } from '@/services/errorService';
import { useAuth } from '@/hooks/useAuth';

interface UseErrorHandlerOptions {
  showToasts?: boolean;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showToasts = true, logErrors = true, context } = options;
  const { user } = useAuth();

  const handleError = useCallback((
    error: Error | string,
    type: ErrorType = ErrorType.SYSTEM_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string
  ): AppError => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? undefined : error;

    const appError = errorService.createError(type, severity, errorMessage, {
      userMessage,
      originalError,
      context: {
        userId: user?.id,
        ...context
      }
    });

    if (showToasts) {
      showErrorToast(appError);
    }

    return appError;
  }, [user?.id, context, showToasts]);

  const showErrorToast = useCallback((appError: AppError) => {
    const message = appError.userMessage || appError.message;
    
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(message, {
          duration: 10000,
          action: {
            label: 'Report',
            onClick: () => reportError(appError)
          }
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(message, { duration: 8000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message, { duration: 6000 });
        break;
      default:
        toast.info(message, { duration: 4000 });
        break;
    }
  }, []);

  const reportError = useCallback(async (appError: AppError) => {
    try {
      const { MonitoringService } = await import('@/services/monitoringService');
      await MonitoringService.reportError(
        new Error(appError.message), 
        'system', 
        { 
          showToast: false,
          includeReportAction: false
        },
        { appError }
      );
      toast.success('Error reported. Thank you!');
    } catch (error) {
      console.error('Failed to report error:', error);
      toast.error('Failed to report error. Please try again.');
    }
  }, []);

  // Convenience methods
  const handleNetworkError = useCallback((error: Error | string, userMessage?: string) => {
    return handleError(error, ErrorType.NETWORK_ERROR, ErrorSeverity.MEDIUM, userMessage);
  }, [handleError]);

  const handleValidationError = useCallback((error: Error | string, userMessage?: string) => {
    return handleError(error, ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, userMessage);
  }, [handleError]);

  const handlePermissionError = useCallback((error: Error | string, userMessage?: string) => {
    return handleError(error, ErrorType.PERMISSION_ERROR, ErrorSeverity.MEDIUM, userMessage);
  }, [handleError]);

  const handleCriticalError = useCallback((error: Error | string, userMessage?: string) => {
    return handleError(error, ErrorType.SYSTEM_ERROR, ErrorSeverity.CRITICAL, userMessage);
  }, [handleError]);

  const showSuccess = useCallback((message: string, duration = 4000) => {
    toast.success(message, { duration });
  }, []);

  const showInfo = useCallback((message: string, duration = 4000) => {
    toast.info(message, { duration });
  }, []);

  const showWarning = useCallback((message: string, duration = 6000) => {
    toast.warning(message, { duration });
  }, []);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handlePermissionError,
    handleCriticalError,
    showSuccess,
    showInfo,
    showWarning,
    reportError
  };
};

// Hook for handling async operations with automatic error handling
export const useAsyncErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { handleError } = useErrorHandler(options);

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage?: string,
    errorType: ErrorType = ErrorType.SYSTEM_ERROR
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(
        error as Error,
        errorType,
        ErrorSeverity.MEDIUM,
        errorMessage
      );
      return null;
    }
  }, [handleError]);

  const executeAsyncWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    errorMessage?: string
  ): Promise<T | null> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          handleError(
            lastError,
            ErrorType.NETWORK_ERROR,
            ErrorSeverity.HIGH,
            errorMessage || `Operation failed after ${maxRetries} attempts`
          );
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    return null;
  }, [handleError]);

  return {
    executeAsync,
    executeAsyncWithRetry,
    handleError
  };
};