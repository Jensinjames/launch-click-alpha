import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFeatureAccessBulk } from './useFeatureAccessBulk';
import { queryDeduplicator } from '@/lib/queryOptimization';

// Lazy loader for features that aren't immediately needed
export const useLazyFeatureLoader = () => {
  const queryClient = useQueryClient();
  const loadedFeatures = useRef<Set<string>>(new Set());

  // Load additional features on demand
  const loadFeatures = useCallback(async (features: string[]) => {
    const unloadedFeatures = features.filter(feature => !loadedFeatures.current.has(feature));
    
    if (unloadedFeatures.length === 0) return;

    const key = `lazy-features-${unloadedFeatures.join(',')}`;
    
    return queryDeduplicator.deduplicate(key, async () => {
      // Mark as loaded immediately to prevent duplicate requests
      unloadedFeatures.forEach(feature => loadedFeatures.current.add(feature));
      
      // Prefetch the features
      await queryClient.prefetchQuery({
        queryKey: ['featureAccessBulk', 'lazy-load', unloadedFeatures.sort()],
        queryFn: async () => {
          // Use the existing bulk hook logic but don't store in main cache
          const { data } = await useFeatureAccessBulk(unloadedFeatures);
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    });
  }, [queryClient]);

  // Smart preloader based on user behavior patterns
  const preloadForRoute = useCallback((route: string) => {
    const routeFeatureMap: Record<string, string[]> = {
      '/teams': ['page_access_teams', 'teams_management'],
      '/analytics': ['page_access_analytics', 'advanced_analytics'],
      '/integrations': ['page_access_integrations', 'integrations'],
      '/admin': ['page_access_admin', 'user_management'],
      '/billing': ['page_access_billing', 'subscription_management'],
    };

    const features = routeFeatureMap[route];
    if (features) {
      // Load in background, don't block navigation
      setTimeout(() => loadFeatures(features), 100);
    }
  }, [loadFeatures]);

  // Progressive feature loading based on user interaction
  const preloadOnHover = useCallback((features: string[]) => {
    // Preload when user hovers over navigation items
    loadFeatures(features);
  }, [loadFeatures]);

  return {
    loadFeatures,
    preloadForRoute,
    preloadOnHover,
    clearCache: () => {
      loadedFeatures.current.clear();
      queryDeduplicator.clear();
    }
  };
};