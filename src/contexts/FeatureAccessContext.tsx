// Fixed Feature Access Context - Eliminates conditional hook calls
import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
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

// Essential features - loaded immediately (critical navigation only)
const ESSENTIAL_FEATURES = [
  'page_access_dashboard',
  'page_access_generate',
  'page_access_content',
  'content_generation'
];

// Secondary features - loaded on demand or route-specific
const SECONDARY_FEATURES = [
  'page_access_teams',
  'page_access_analytics', 
  'page_access_integrations',
  'page_access_settings',
  'page_access_admin',
  'page_access_billing',
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
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOK CALLS
  const { user, loading: authLoading } = useAuth();
  
  // Use useRef for performance metrics to avoid re-renders
  const performanceMetricsRef = useRef<{
    loadTime?: number;
    cacheHitRate?: number;
    lastRefresh?: number;
    hookCallCount?: number;
  }>({});
  
  // Add hook call counter for debugging in development
  if (import.meta.env.DEV) {
    performanceMetricsRef.current.hookCallCount = (performanceMetricsRef.current.hookCallCount || 0) + 1;
  }
  
  // Pre-calculate all values to avoid conditional hook calls
  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.includes(route || '/');
  }, [route]);

  const optimizedFeatures = useMemo(() => {
    if (preloadFeatures) return preloadFeatures;
    
    // Load essential features + route-specific features only
    const routeSpecific = route && ROUTE_FEATURES[route as keyof typeof ROUTE_FEATURES] 
      ? ROUTE_FEATURES[route as keyof typeof ROUTE_FEATURES] 
      : [];
    
    // Combine essential + unique route features (avoid duplicates)
    const combined = [...ESSENTIAL_FEATURES, ...routeSpecific];
    return Array.from(new Set(combined));
  }, [preloadFeatures, route]);

  const shouldStartFeatureChecks = !authLoading && user;
  const startTimeRef = useRef(performance.now());

  // ALWAYS call the hook - never conditionally
  const { 
    data: accessMap = {}, 
    isLoading, 
    error,
    dataUpdatedAt,
    isFetching 
  } = useFeatureAccessBulk(optimizedFeatures);

  // Track performance metrics with useRef to avoid re-renders
  useEffect(() => {
    if (accessMap && Object.keys(accessMap).length > 0 && !isLoading) {
      const loadTime = performance.now() - startTimeRef.current;
      performanceMetricsRef.current = {
        ...performanceMetricsRef.current,
        loadTime,
        lastRefresh: Date.now(),
        cacheHitRate: performanceMetricsRef.current.cacheHitRate ? 
          (performanceMetricsRef.current.cacheHitRate + 1) / 2 : 1
      };
    }
  }, [accessMap, isLoading]);

  const hasAccess = useCallback((featureName: string) => {
    // If we don't have feature data yet and should start checks, return false for protected features
    if (shouldStartFeatureChecks && Object.keys(accessMap).length === 0) {
      return false;
    }
    
    const result = accessMap[featureName] || false;
    if (import.meta.env.DEV) {
      console.log(`[FeatureAccess] Check '${featureName}':`, result, 'AccessMap:', Object.keys(accessMap));
    }
    return result;
  }, [accessMap, shouldStartFeatureChecks]);

  const canUseAny = useCallback((features: string[]) => {
    return features.some(feature => accessMap[feature]);
  }, [accessMap]);

  const canUseAll = useCallback((features: string[]) => {
    return features.every(feature => accessMap[feature]);
  }, [accessMap]);

  const preloadFeaturesFn = useCallback((features: string[]) => {
    if (import.meta.env.DEV) {
      console.log('[FeatureAccess] Preload requested for:', features);
    }
  }, []);

  // Enhanced error handling with fallback
  const handleError = useCallback((error: any) => {
    console.warn('[FeatureAccess] Provider error, using fallback mode:', error);
    
    return {
      hasAccess: () => true,
      canUseAny: () => true,
      canUseAll: () => true,
      isLoading: false,
      isAuthReady: !authLoading,
      error,
      preloadFeatures: () => {},
      performanceMetrics: performanceMetricsRef.current
    };
  }, [authLoading]);

  // Context value - ALWAYS created, no conditional returns before this
  const value = useMemo(() => ({
    hasAccess,
    canUseAny,
    canUseAll,
    isLoading: shouldStartFeatureChecks ? isLoading : false,
    isAuthReady: !authLoading,
    error,
    preloadFeatures: preloadFeaturesFn,
    performanceMetrics: performanceMetricsRef.current,
  }), [hasAccess, canUseAny, canUseAll, isLoading, authLoading, error, preloadFeaturesFn, shouldStartFeatureChecks]);

  // Handle critical errors with fallback - NO EARLY RETURN, use conditional rendering
  const hasCriticalError = error && !accessMap && Object.keys(accessMap).length === 0;
  const shouldShowSkeleton = !isPublicRoute && (authLoading || (shouldStartFeatureChecks && isLoading && Object.keys(accessMap).length === 0));

  if (hasCriticalError) {
    const fallbackValue = handleError(error);
    return (
      <FeatureAccessErrorBoundary fallbackContext={fallbackValue}>
        <FeatureAccessContext.Provider value={fallbackValue}>
          {children}
        </FeatureAccessContext.Provider>
      </FeatureAccessErrorBoundary>
    );
  }

  if (shouldShowSkeleton) {
    return (
      <FeatureAccessErrorBoundary fallbackContext={value}>
        <FeatureAccessContext.Provider value={value}>
          <div className="min-h-screen bg-background">
            <PageContentSkeleton sections={4} />
          </div>
        </FeatureAccessContext.Provider>
      </FeatureAccessErrorBoundary>
    );
  }

  // Normal render path
  return (
    <FeatureAccessErrorBoundary fallbackContext={value}>
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