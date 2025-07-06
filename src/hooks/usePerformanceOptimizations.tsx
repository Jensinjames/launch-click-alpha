import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { memoryOptimization, performanceMonitor } from '@/lib/queryOptimization';
import { useLazyFeatureLoader } from './useLazyFeatureLoader';

// Central hook to apply performance optimizations
export const usePerformanceOptimizations = (route?: string) => {
  const queryClient = useQueryClient();
  const { preloadForRoute } = useLazyFeatureLoader();
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Preload features for current route
    if (route) {
      preloadForRoute(route);
    }

    // Set up periodic cache optimization
    cleanupInterval.current = setInterval(() => {
      // Clear stale cache entries (older than 20 minutes)
      memoryOptimization.clearStaleCache(queryClient, 20 * 60 * 1000);
      
      // Optimize cache size (max 80 queries to prevent memory bloat)
      memoryOptimization.optimizeCacheSize(queryClient, 80);
      
      // Track cache performance in development
      if (import.meta.env.DEV) {
        performanceMonitor.trackCacheHitRate(queryClient);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [route, queryClient, preloadForRoute]);

  // Performance optimization methods
  return {
    // Force cache cleanup
    optimizeNow: () => {
      memoryOptimization.clearStaleCache(queryClient);
      memoryOptimization.optimizeCacheSize(queryClient, 50);
    },
    
    // Get performance stats
    getPerformanceStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      return {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
        cachedQueries: queries.filter(q => q.state.data).length,
        stalQueries: queries.filter(q => q.isStale()).length,
        memoryUsageApprox: queries.length * 0.1, // Rough estimate in MB
      };
    }
  };
};