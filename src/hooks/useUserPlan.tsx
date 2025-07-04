
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPlan {
  planType: 'starter' | 'pro' | 'growth' | 'elite';
  credits: number;
  creditsUsed: number;
  monthlyLimit: number;
  teamSeats: number;
  status: string;
}

export const useUserPlanQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userPlan', user?.id],
    queryFn: async (): Promise<UserPlan> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch user plan data
      const { data: planData, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (planError) {
        console.error('Error fetching user plan:', planError);
        throw new Error('Failed to fetch plan data');
      }

      if (!planData) {
        throw new Error('No plan data found for user');
      }

      // Fetch user credits data
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) {
        console.error('Error fetching user credits:', creditsError);
        throw new Error('Failed to fetch credits data');
      }

      if (!creditsData) {
        throw new Error('No credits data found for user');
      }

      return {
        planType: planData.plan_type,
        credits: planData.credits,
        creditsUsed: creditsData.credits_used,
        monthlyLimit: creditsData.monthly_limit,
        teamSeats: planData.team_seats,
        status: planData.status
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

// Convenience hooks for specific functionality
export const useUserPlan = () => {
  const query = useUserPlanQuery();
  
  const hasAccess = (requiredPlans: string[]): boolean => {
    if (!query.data) return false;
    return requiredPlans.includes(query.data.planType);
  };

  const canManageTeams = (): boolean => {
    if (!query.data) return false;
    return ['growth', 'elite'].includes(query.data.planType);
  };

  const hasCreditsRemaining = (): boolean => {
    if (!query.data) return false;
    return query.data.creditsUsed < query.data.monthlyLimit;
  };

  return {
    plan: query.data,
    loading: query.isLoading,
    error: query.error?.message || null,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    hasAccess,
    canManageTeams,
    hasCreditsRemaining
  };
};
