// Enhanced Bulk Feature Access Hook - Phase 2 Optimizations
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect } from 'react';

export interface FeatureAccessResult {
  [featureName: string]: boolean;
}

interface CacheEntry {
  data: FeatureAccessResult;
  timestamp: number;
  stale: boolean;
}

// Enhanced hook with stale-while-revalidate caching
export const useFeatureAccessBulk = (featureNames: string[]) => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Background refresh function for stale-while-revalidate
  const backgroundRefresh = useCallback(async () => {
    if (!user?.id || featureNames.length === 0) return;
    
    try {
      const { data, error } = await supabase.rpc('bulk_feature_access_check', {
        feature_names: featureNames,
        check_user_id: user.id
      });

      if (!error && data) {
        // Update cache with fresh data
        queryClient.setQueryData(
          ['featureAccessBulk', user?.id, featureNames.sort()], 
          data as FeatureAccessResult
        );
      }
    } catch (error) {
      console.error('[FeatureAccessBulk] Background refresh failed:', error);
    }
  }, [user?.id, featureNames, queryClient]);

  const query = useQuery({
    queryKey: ['featureAccessBulk', user?.id, featureNames.sort()],
    queryFn: async (): Promise<FeatureAccessResult> => {
      if (!user?.id || featureNames.length === 0) {
        return {};
      }

      const startTime = performance.now();
      
      try {
        // Use new bulk function - reduces 9 RPC calls to 1
        const { data, error } = await supabase.rpc('bulk_feature_access_check', {
          feature_names: featureNames,
          check_user_id: user.id
        });

        const endTime = performance.now();
        console.log(`[FeatureAccessBulk] Bulk check completed in ${endTime - startTime}ms for ${featureNames.length} features`);

        if (error) {
          console.error('[FeatureAccessBulk] Bulk RPC error:', error);
          // Fallback to individual calls on bulk failure
          return await fallbackIndividualCalls(featureNames, user.id);
        }

        return (data as FeatureAccessResult) || {};
      } catch (error) {
        console.error('[FeatureAccessBulk] Query failed, using fallback:', error);
        return await fallbackIndividualCalls(featureNames, user.id);
      }
    },
    enabled: !loading && !!user?.id && featureNames.length > 0,
    staleTime: 8 * 60 * 1000, // 8 minutes - longer for feature access (stable data)
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    // Stale-while-revalidate: return stale data immediately while fetching fresh
    refetchOnReconnect: true,
    networkMode: 'offlineFirst',
  });

  // Schedule background refresh for stale data
  useEffect(() => {
    if (query.data && query.isStale && !query.isFetching) {
      const timer = setTimeout(backgroundRefresh, 100); // Small delay to avoid blocking
      return () => clearTimeout(timer);
    }
  }, [query.data, query.isStale, query.isFetching, backgroundRefresh]);

  return query;
};

// Fallback function for individual calls if bulk fails
async function fallbackIndividualCalls(featureNames: string[], userId: string): Promise<FeatureAccessResult> {
  console.warn('[FeatureAccessBulk] Using fallback individual calls');
  const results: FeatureAccessResult = {};
  
  // Batch individual calls with concurrency limit to avoid overwhelming DB
  const batchSize = 3;
  for (let i = 0; i < featureNames.length; i += batchSize) {
    const batch = featureNames.slice(i, i + batchSize);
    const promises = batch.map(async (featureName) => {
      try {
        const { data, error } = await supabase.rpc('can_access_with_contract', {
          feature_name: featureName,
          check_user_id: userId
        });
        return { featureName, access: !error && (data || false) };
      } catch {
        return { featureName, access: false };
      }
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ featureName, access }) => {
      results[featureName] = access;
    });
  }

  return results;
}

// Helper hook for checking access to multiple features with individual loading states
export const useFeatureAccessMap = (featureNames: string[]) => {
  const { data: accessMap = {}, isLoading, error } = useFeatureAccessBulk(featureNames);
  
  return {
    hasAccess: (featureName: string) => accessMap[featureName] || false,
    canUseAny: (features: string[]) => features.some(feature => accessMap[feature]),
    canUseAll: (features: string[]) => features.every(feature => accessMap[feature]),
    accessMap,
    isLoading,
    error,
  };
};