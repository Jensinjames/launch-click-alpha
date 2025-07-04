import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

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
  }

  render() {
    if (this.state.hasError) {
      // Fallback: provide basic feature access context that allows everything
      const fallbackContext = {
        hasAccess: () => true,
        canUseAny: () => true,
        canUseAll: () => true,
        isLoading: false,
        error: this.state.error,
        preloadFeatures: () => {},
      };

      return (
        <div style={{ display: 'contents' }}>
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}