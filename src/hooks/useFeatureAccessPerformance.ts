// Feature Access Performance Hook - Separated Performance Tracking
import { useRef, useEffect } from 'react';

interface PerformanceMetrics {
  loadTime?: number;
  cacheHitRate?: number;
  lastRefresh?: number;
  hookCallCount?: number;
}

export const useFeatureAccessPerformance = (
  accessMap: Record<string, boolean>,
  isLoading: boolean
) => {
  const performanceMetricsRef = useRef<PerformanceMetrics>({});
  const startTimeRef = useRef(performance.now());

  // Add hook call counter for debugging in development
  if (import.meta.env.DEV) {
    performanceMetricsRef.current.hookCallCount = (performanceMetricsRef.current.hookCallCount || 0) + 1;
  }

  // Track performance metrics
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

      if (import.meta.env.DEV) {
        console.log('[FeatureAccess] Performance metrics:', performanceMetricsRef.current);
      }
    }
  }, [accessMap, isLoading]);

  return {
    performanceMetrics: performanceMetricsRef.current as Record<string, unknown>,
    resetMetrics: () => {
      performanceMetricsRef.current = {};
      startTimeRef.current = performance.now();
    }
  };
};