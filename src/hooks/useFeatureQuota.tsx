import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { FeatureGatingService, type FeatureUsageInfo } from '@/services/featureGatingService';

export const useFeatureQuota = (featureName: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['featureQuota', user?.id, featureName],
    queryFn: async (): Promise<FeatureUsageInfo> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('[FeatureQuota] Checking quota for:', featureName, 'user:', user.id);

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Feature quota check timeout')), 5000);
        });

        const quotaPromise = FeatureGatingService.checkUsage(user.id, featureName);
        
        return await Promise.race([quotaPromise, timeoutPromise]);
      } catch (error) {
        console.error('[FeatureQuota] Error checking quota:', error);
        // Emergency fallback - return basic usage info
        return {
          used: 0,
          limit: null, // Unlimited for emergency fallback
          remaining: null,
          resetDate: new Date().toISOString(),
          canUse: true, // Allow access during errors
        };
      }
    },
    enabled: !!user?.id && !!featureName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once
    retryDelay: 1000,
  });
};

export const useBulkFeatureQuotas = (featureNames: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bulkFeatureQuotas', user?.id, ...featureNames.sort()],
    queryFn: async (): Promise<Record<string, FeatureUsageInfo>> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      return FeatureGatingService.getBulkUsage(user.id, featureNames);
    },
    enabled: !!user?.id && featureNames.length > 0,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

// Hook to check if user can perform an action before doing it
export const useCanUseFeature = (featureName: string) => {
  const { data: quota, isLoading, error } = useFeatureQuota(featureName);

  return {
    canUse: quota?.canUse ?? false,
    remaining: quota?.remaining,
    limit: quota?.limit,
    used: quota?.used,
    isLoading,
    error,
    isQuotaExceeded: quota?.limit !== null && (quota?.used ?? 0) >= quota?.limit,
    isNearLimit: quota?.limit !== null && (quota?.used ?? 0) >= quota?.limit * 0.8,
  };
};