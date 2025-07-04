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
  '/dashboard': ['page_access_dashboard', 'content_generation', 'analytics'],
  '/generate': ['content_generation', 'templates', 'image_generation'],
  '/analytics': ['page_access_analytics', 'teams'],
  '/teams': ['page_access_teams'],
  '/integrations': ['page_access_integrations'],
  '/admin': ['page_access_admin'],
  '/billing': ['page_access_billing'],
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/login', 
  '/signup', 
  '/pricing'
];

// Core features - always loaded (ALL navigation features preloaded)
const CORE_FEATURES = [
  'page_access_dashboard',
  'page_access_generate',
  'page_access_content',
  'page_access_teams',
  'page_access_analytics',
  'page_access_integrations',
  'page_access_settings',
  'page_access_admin',
  'page_access_billing',
  'content_generation',
  'templates',
  'image_generation',
  'integrations'
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
    const result = accessMap[featureName] || false;
    console.log(`[FeatureAccess] Check '${featureName}':`, result, 'AccessMap:', Object.keys(accessMap));
    return result;
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