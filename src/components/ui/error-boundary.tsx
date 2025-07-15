import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from '@/lib/icons';
import { errorService, ErrorType, ErrorSeverity } from '@/services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our centralized service
    const appError = errorService.systemError(
      `React Error Boundary: ${error.message}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        retryCount: this.state.retryCount
      }
    );

    this.setState({ errorId: appError.id });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const error = this.state.error;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-error/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-error" />
                </div>
              </div>
              <CardTitle className="text-error">Something went wrong</CardTitle>
              <CardDescription>
                {canRetry 
                  ? "We encountered an unexpected error. You can try again or return to the home page."
                  : "Multiple errors occurred. Please refresh the page or return to the home page."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.props.showErrorDetails && error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">Error Details:</p>
                  <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Retry attempt: {this.state.retryCount} / {this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different contexts
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      errorService.systemError(
        `Dashboard Error: ${error.message}`,
        error,
        { context: 'dashboard', componentStack: errorInfo.componentStack }
      );
    }}
  >
    {children}
  </ErrorBoundary>
);

export const ContentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      errorService.systemError(
        `Content Error: ${error.message}`,
        error,
        { context: 'content', componentStack: errorInfo.componentStack }
      );
    }}
  >
    {children}
  </ErrorBoundary>
);