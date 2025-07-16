
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceLogger } from '@/services/logger/domainLoggers';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ErrorBoundaryProvider extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use structured logging for error boundaries
    performanceLogger.error(error, {
      boundary: 'ErrorBoundaryProvider',
      errorInfo: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });
    
    this.props.onError?.(error, errorInfo);
    
    // Notify user of the error
    toast({
      variant: "destructive",
      title: "Application Error",
      description: "Something went wrong. Please try again or reload the page."
    });
    
    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      import('@/services/monitoringService').then(({ MonitoringService }) => {
        MonitoringService.reportError(
          error, 
          'system', 
          { 
            showToast: false,
            includeReportAction: false
          },
          { errorInfo }
        ).catch((monitoringError) => {
          performanceLogger.error(monitoringError, {
            context: 'monitoring_service_fallback',
            originalError: error.message
          });
        });
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full surface-elevated">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-error-light rounded-full w-fit">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-secondary">
                We apologize for the inconvenience. Please try again or reload the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-surface rounded-md border border-border">
                  <p className="text-sm font-medium text-error mb-1">Error Details:</p>
                  <p className="text-xs text-tertiary font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              
              {this.state.retryCount >= 3 && (
                <p className="text-xs text-tertiary text-center">
                  If the problem persists, please contact support.
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

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryProvider {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryProvider>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
