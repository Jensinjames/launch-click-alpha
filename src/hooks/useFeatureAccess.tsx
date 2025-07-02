import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureAccess = (featureName: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['featureAccess', user?.id, featureName],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) {
        return false;
      }

      const { data, error } = await supabase.rpc('can_access_with_contract', {
        feature_name: featureName,
        check_user_id: user.id
      });

      if (error) {
        console.error('[FeatureAccess] RPC error:', error);
        return false;
      }

      return data || false;
    },
    enabled: !!user?.id && !!featureName,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
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