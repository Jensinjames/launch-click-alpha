// Centralized Error Handling Service
export enum ErrorType {
  USER_ERROR = 'user',
  SYSTEM_ERROR = 'system',
  NETWORK_ERROR = 'network',
  VALIDATION_ERROR = 'validation',
  PERMISSION_ERROR = 'permission'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage?: string;
  code?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

class ErrorService {
  private static instance: ErrorService;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    options?: {
      userMessage?: string;
      code?: string;
      context?: Record<string, unknown>;
      originalError?: Error;
    }
  ): AppError {
    const error: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      userMessage: options?.userMessage || this.getDefaultUserMessage(type, severity),
      code: options?.code,
      context: options?.context,
      timestamp: new Date(),
      stack: options?.originalError?.stack
    };

    this.addToHistory(error);
    this.logError(error);
    
    return error;
  }

  private getDefaultUserMessage(type: ErrorType, severity: ErrorSeverity): string {
    if (severity === ErrorSeverity.CRITICAL) {
      return 'A critical error occurred. Please contact support if this continues.';
    }
    
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issue. Please check your internet connection.';
      case ErrorType.VALIDATION_ERROR:
        return 'Please check the information you entered and try again.';
      case ErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.USER_ERROR:
        return 'Please check your input and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp.toISOString()
    };

    if (logLevel === 'error') {
      console.error('[ERROR]', logData, error.stack);
    } else if (logLevel === 'warn') {
      console.warn('[WARN]', logData);
    } else {
      console.info('[INFO]', logData);
    }

    // In production, send to monitoring service
    if (import.meta.env.PROD && error.severity === ErrorSeverity.CRITICAL) {
      this.sendToMonitoring(error);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'info';
    }
  }

  private sendToMonitoring(error: AppError): void {
    // TODO: Implement monitoring service integration
    console.error('CRITICAL ERROR - NEEDS MONITORING:', error);
  }

  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  getErrorById(id: string): AppError | undefined {
    return this.errorHistory.find(error => error.id === id);
  }

  clearHistory(): void {
    this.errorHistory = [];
  }

  // Convenience methods for common error types
  networkError(message: string, context?: Record<string, unknown>): AppError {
    return this.createError(ErrorType.NETWORK_ERROR, ErrorSeverity.MEDIUM, message, { context });
  }

  validationError(message: string, userMessage?: string, context?: Record<string, unknown>): AppError {
    return this.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, message, { 
      userMessage, 
      context 
    });
  }

  permissionError(message: string, context?: Record<string, unknown>): AppError {
    return this.createError(ErrorType.PERMISSION_ERROR, ErrorSeverity.MEDIUM, message, { context });
  }

  systemError(message: string, originalError?: Error, context?: Record<string, unknown>): AppError {
    return this.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH, message, { 
      originalError, 
      context 
    });
  }

  criticalError(message: string, originalError?: Error, context?: Record<string, unknown>): AppError {
    return this.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.CRITICAL, message, { 
      originalError, 
      context 
    });
  }
}

export const errorService = ErrorService.getInstance();