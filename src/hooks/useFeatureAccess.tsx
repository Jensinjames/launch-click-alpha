import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureAccess = (featureName: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['featureAccess', user?.id, featureName],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) {
        console.log('[FeatureAccess] No user ID, returning false');
        return false;
      }

      console.log('[FeatureAccess] Checking access for:', featureName, 'user:', user.id);

      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Feature access check timeout')), 5000);
        });

        const rpcPromise = supabase.rpc('can_access_with_contract', {
          feature_name: featureName,
          check_user_id: user.id
        });

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

        if (error) {
          console.error('[FeatureAccess] RPC error:', error);
          // Emergency fallback: assume basic access for essential features
          const basicFeatures = ['page_access_dashboard', 'page_access_teams', 'page_access_analytics'];
          if (basicFeatures.includes(featureName)) {
            console.warn('[FeatureAccess] Fallback: granting access to basic feature:', featureName);
            return true;
          }
          return false;
        }

        console.log('[FeatureAccess] RPC result for', featureName, ':', data);
        return data || false;
      } catch (error) {
        console.error('[FeatureAccess] Caught error:', error);
        // Emergency fallback for timeout or other errors
        const basicFeatures = ['page_access_dashboard', 'page_access_teams', 'page_access_analytics'];
        if (basicFeatures.includes(featureName)) {
          console.warn('[FeatureAccess] Emergency fallback: granting access to basic feature:', featureName);
          return true;
        }
        return false;
      }
    },
    enabled: !!user?.id && !!featureName,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 30 seconds
    refetchOnWindowFocus: false, // Reduce aggressive refetching
    retry: 1, // Only retry once
    retryDelay: 1000,
  });
};

// Convenience hook that matches the existing useCanUseFeature interface
export const useCanUseFeature = (featureName: string) => {
  const { data: canUse = false, isLoading, error } = useFeatureAccess(featureName);
  
  return {
    canUse,
    isLoading,
    error,
  };
};