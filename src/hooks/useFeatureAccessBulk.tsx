// Bulk Feature Access Hook - Optimized for Performance
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureAccessResult {
  [featureName: string]: boolean;
}

export const useFeatureAccessBulk = (featureNames: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['featureAccessBulk', user?.id, featureNames.sort()],
    queryFn: async (): Promise<FeatureAccessResult> => {
      if (!user?.id || featureNames.length === 0) {
        return {};
      }

      const results: FeatureAccessResult = {};
      
      // Batch check all features in parallel
      const promises = featureNames.map(async (featureName) => {
        const { data, error } = await supabase.rpc('can_access_with_contract', {
          feature_name: featureName,
          check_user_id: user.id
        });

        if (error) {
          console.error(`[FeatureAccessBulk] RPC error for ${featureName}:`, error);
          return { featureName, access: false };
        }

        return { featureName, access: data || false };
      });

      const resolvedPromises = await Promise.all(promises);
      
      resolvedPromises.forEach(({ featureName, access }) => {
        results[featureName] = access;
      });

      return results;
    },
    enabled: !!user?.id && featureNames.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes for stable features
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

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