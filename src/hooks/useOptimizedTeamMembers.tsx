
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamAdminData, TeamMemberWithCredits } from '@/types/team';

export const useOptimizedTeamMembers = (teamId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['optimized-team-members', teamId],
    queryFn: async (): Promise<TeamAdminData> => {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
        body: { team_id: teamId },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Error fetching team admin data:', error);
        throw new Error(error.message || 'Failed to fetch team data');
      }

      if (!data) {
        throw new Error('No data returned from server');
      }

      return data as TeamAdminData;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Memoized computed values to prevent unnecessary recalculations
  const memoizedData = useMemo(() => {
    if (!data) return null;

    const sortedMembers = [...data.members].sort((a, b) => {
      // Sort by role priority first (owner > admin > editor > viewer)
      const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3 };
      const roleComparison = roleOrder[a.role] - roleOrder[b.role];
      if (roleComparison !== 0) return roleComparison;
      
      // Then by name
      return a.name.localeCompare(b.name);
    });

    const creditAnalytics = {
      totalCreditsUsed: data.members.reduce((sum, member) => sum + member.credits.credits_used, 0),
      averageUtilization: data.members.length > 0 
        ? data.members.reduce((sum, member) => 
            sum + (member.credits.credits_used / member.credits.monthly_limit * 100), 0
          ) / data.members.length 
        : 0,
      topUsers: [...data.members]
        .sort((a, b) => b.credits.credits_used - a.credits.credits_used)
        .slice(0, 5),
    };

    return {
      ...data,
      members: sortedMembers,
      analytics: creditAnalytics,
    };
  }, [data]);

  return {
    data: memoizedData,
    isLoading,
    error,
    refetch,
    // Helper functions for filtering
    getActiveMembers: useMemo(() => 
      () => memoizedData?.members.filter(m => m.status === 'active') || []
    , [memoizedData]),
    getMembersByRole: useMemo(() => 
      (role: string) => memoizedData?.members.filter(m => m.role === role) || []
    , [memoizedData]),
  };
};
