import React, { Component, ReactNode, createContext } from 'react';

interface FeatureAccessContextType {
  hasAccess: (featureName: string) => boolean;
  canUseAny: (features: string[]) => boolean;
  canUseAll: (features: string[]) => boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  error: any;
  preloadFeatures: (features: string[]) => void;
  performanceMetrics: {
    loadTime?: number;
    cacheHitRate?: number;
    lastRefresh?: number;
  };
}

interface Props {
  children: ReactNode;
  fallbackContext?: FeatureAccessContextType;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Create a fallback context for error boundary
const FallbackFeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

export class FeatureAccessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FeatureAccess Error Boundary caught an error:', error, errorInfo);
    
    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      // Add monitoring service integration here if needed
    }
  }

  render() {
    if (this.state.hasError) {
      // Use provided fallback context or create a safe default
      const fallbackContext: FeatureAccessContextType = this.props.fallbackContext || {
        hasAccess: () => true, // Fail open for accessibility
        canUseAny: () => true,
        canUseAll: () => true,
        isLoading: false,
        isAuthReady: true,
        error: this.state.error,
        preloadFeatures: () => {},
        performanceMetrics: {},
      };

      return (
        <FallbackFeatureAccessContext.Provider value={fallbackContext}>
          <div style={{ display: 'contents' }}>
            {this.props.children}
          </div>
        </FallbackFeatureAccessContext.Provider>
      );
    }

    return this.props.children;
  }
}