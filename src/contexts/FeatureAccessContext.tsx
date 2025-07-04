// Enhanced Feature Access Context - Phase 2 Optimizations
import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useFeatureAccessBulk, FeatureAccessResult } from '@/hooks/useFeatureAccessBulk';
import { FeatureAccessErrorBoundary } from '@/components/providers/FeatureAccessErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { PageContentSkeleton } from '@/components/ui/skeleton-loader';

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

const FeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

// Route-based feature mapping for lazy loading
const ROUTE_FEATURES = {
  '/dashboard': ['dashboard', 'content_generation', 'analytics'],
  '/generate': ['content_generation', 'templates', 'image_generation'],
  '/analytics': ['analytics', 'teams'],
  '/teams': ['teams'],
  '/integrations': ['integrations'],
  '/admin': ['admin_panel'],
  '/billing': ['billing'],
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/login', 
  '/signup', 
  '/pricing'
];

// Core features - always loaded
const CORE_FEATURES = [
  'dashboard',
  'content_generation',
  'analytics',
  'teams',
  'integrations',
  'admin_panel',
  'billing',
  'templates',
  'image_generation'
];

interface FeatureAccessProviderProps {
  children: React.ReactNode;
  preloadFeatures?: string[];
  route?: string;
}

export const FeatureAccessProvider: React.FC<FeatureAccessProviderProps> = ({ 
  children, 
  preloadFeatures,
  route 
}) => {
  const { user, loading: authLoading } = useAuth();
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    loadTime?: number;
    cacheHitRate?: number;
    lastRefresh?: number;
  }>({});
  
  // Check if current route is public (doesn't need authentication)
  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.includes(route || '/');
  }, [route]);

  // Optimize features based on current route
  const optimizedFeatures = useMemo(() => {
    if (preloadFeatures) return preloadFeatures;
    if (route && ROUTE_FEATURES[route as keyof typeof ROUTE_FEATURES]) {
      return [...CORE_FEATURES, ...ROUTE_FEATURES[route as keyof typeof ROUTE_FEATURES]];
    }
    return CORE_FEATURES;
  }, [preloadFeatures, route]);

  // Only start feature access checks when auth is ready
  const shouldStartFeatureChecks = !authLoading && user;
  const startTime = performance.now();

  const { 
    data: accessMap = {}, 
    isLoading, 
    error,
    dataUpdatedAt,
    isFetching 
  } = useFeatureAccessBulk(shouldStartFeatureChecks ? optimizedFeatures : []);

  // Track performance metrics
  useEffect(() => {
    if (accessMap && Object.keys(accessMap).length > 0 && !isLoading) {
      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime,
        lastRefresh: Date.now(),
        cacheHitRate: prev.cacheHitRate ? (prev.cacheHitRate + 1) / 2 : 1
      }));
    }
  }, [accessMap, isLoading, startTime]);

  // Enhanced error handling with fallback
  const handleError = useCallback((error: any) => {
    console.warn('[FeatureAccess] Provider error, using fallback mode:', error);
    
    // Return permissive fallback for non-critical errors
    return {
      hasAccess: () => true,
      canUseAny: () => true,
      canUseAll: () => true,
      isLoading: false,
      isAuthReady: !authLoading,
      error,
      preloadFeatures: () => {},
      performanceMetrics: {}
    };
  }, [authLoading]);

  // Handle critical errors with fallback
  if (error && !accessMap && Object.keys(accessMap).length === 0) {
    const fallbackValue = handleError(error);
    return (
      <FeatureAccessErrorBoundary>
        <FeatureAccessContext.Provider value={fallbackValue}>
          {children}
        </FeatureAccessContext.Provider>
      </FeatureAccessErrorBoundary>
    );
  }

  // Show skeleton while auth is loading or initial feature check
  // BUT only for protected routes - public routes should render immediately
  if (!isPublicRoute && (authLoading || (shouldStartFeatureChecks && isLoading && Object.keys(accessMap).length === 0))) {
    return (
      <div className="min-h-screen bg-background">
        <PageContentSkeleton sections={4} />
      </div>
    );
  }

  const hasAccess = useCallback((featureName: string) => {
    return accessMap[featureName] || false;
  }, [accessMap]);

  const canUseAny = useCallback((features: string[]) => {
    return features.some(feature => accessMap[feature]);
  }, [accessMap]);

  const canUseAll = useCallback((features: string[]) => {
    return features.every(feature => accessMap[feature]);
  }, [accessMap]);

  const preloadFeaturesFn = useCallback((features: string[]) => {
    // This would trigger a new query with additional features
    // For now, we'll log it for future implementation
    console.log('[FeatureAccess] Preload requested for:', features);
  }, []);

  const value = useMemo(() => ({
    hasAccess,
    canUseAny,
    canUseAll,
    isLoading,
    isAuthReady: !authLoading,
    error,
    preloadFeatures: preloadFeaturesFn,
    performanceMetrics,
  }), [hasAccess, canUseAny, canUseAll, isLoading, authLoading, error, preloadFeaturesFn, performanceMetrics]);

  return (
    <FeatureAccessErrorBoundary>
      <FeatureAccessContext.Provider value={value}>
        {children}
      </FeatureAccessContext.Provider>
    </FeatureAccessErrorBoundary>
  );
};

export const useFeatureAccessContext = () => {
  const context = useContext(FeatureAccessContext);
  if (context === undefined) {
    throw new Error('useFeatureAccessContext must be used within a FeatureAccessProvider');
  }
  return context;
};