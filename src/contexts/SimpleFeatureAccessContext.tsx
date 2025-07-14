// Simplified Feature Access Context - Focused on Core Functionality
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useFeatureAccessBulk } from '@/hooks/useFeatureAccessBulk';
import { FeatureAccessService } from '@/services/featureAccessService';
import { useFeatureAccessPerformance, PerformanceMetrics } from '@/hooks/useFeatureAccessPerformance';
import { useAuth } from '@/hooks/useAuth';

interface FeatureAccessContextType {
  hasAccess: (featureName: string) => boolean;
  canUseAny: (features: string[]) => boolean;
  canUseAll: (features: string[]) => boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  error: unknown;
  preloadFeatures: (features: string[]) => void;
  performanceMetrics: PerformanceMetrics;
}

const FeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

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
  
  // Check if this is a public route
  const isPublicRoute = useMemo(() => {
    return FeatureAccessService.isPublicRoute(route || '/');
  }, [route]);

  // Get optimized features for this route
  const optimizedFeatures = useMemo(() => {
    return FeatureAccessService.getOptimizedFeatures(route, preloadFeatures);
  }, [preloadFeatures, route]);

  // Determine if we should start feature checks
  const shouldStartFeatureChecks = !authLoading && user;

  // Always call the hook - never conditionally
  const { 
    data: accessMap = {}, 
    isLoading, 
    error
  } = useFeatureAccessBulk(optimizedFeatures);

  // Track performance metrics with separate hook
  const { performanceMetrics } = useFeatureAccessPerformance(accessMap, isLoading);

  // Core feature access functions
  const hasAccess = useCallback((featureName: string) => {
    if (shouldStartFeatureChecks && Object.keys(accessMap).length === 0) {
      return false;
    }
    
    const result = FeatureAccessService.hasFeatureAccess(featureName, accessMap);
    
    if (import.meta.env.DEV) {
      console.log(`[FeatureAccess] Check '${featureName}':`, result);
    }
    
    return result;
  }, [accessMap, shouldStartFeatureChecks]);

  const canUseAny = useCallback((features: string[]) => {
    return FeatureAccessService.canUseAny(features, accessMap);
  }, [accessMap]);

  const canUseAll = useCallback((features: string[]) => {
    return FeatureAccessService.canUseAll(features, accessMap);
  }, [accessMap]);

  const preloadFeaturesFn = useCallback((features: string[]) => {
    if (import.meta.env.DEV) {
      console.log('[FeatureAccess] Preload requested for:', features);
    }
  }, []);

  // Context value
  const value = useMemo(() => ({
    hasAccess,
    canUseAny,
    canUseAll,
    isLoading: shouldStartFeatureChecks ? isLoading : false,
    isAuthReady: !authLoading,
    error,
    preloadFeatures: preloadFeaturesFn,
    performanceMetrics,
  }), [
    hasAccess, 
    canUseAny, 
    canUseAll, 
    isLoading, 
    authLoading, 
    error, 
    preloadFeaturesFn, 
    shouldStartFeatureChecks,
    performanceMetrics
  ]);

  // Handle critical errors with fallback
  if (error && !accessMap && Object.keys(accessMap).length === 0) {
    const fallbackValue = {
      ...FeatureAccessService.createFallbackHandler(),
      performanceMetrics: {} as PerformanceMetrics
    };
    return (
      <FeatureAccessContext.Provider value={fallbackValue}>
        {children}
      </FeatureAccessContext.Provider>
    );
  }

  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
};

export const useFeatureAccessContext = () => {
  const context = useContext(FeatureAccessContext);
  if (context === undefined) {
    throw new Error('useFeatureAccessContext must be used within a FeatureAccessProvider');
  }
  return context;
};