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

      try {
        const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
          body: { team_id: teamId },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Edge function error details:', error);
          
          // Provide more specific error messages based on the error type
          if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
            throw new Error('You do not have permission to view this team\'s data');
          }
          
          if (error.message?.includes('not found')) {
            throw new Error('Team not found or you do not have access to it');
          }
          
          throw new Error(`Failed to fetch team data: ${error.message || 'Unknown error'}`);
        }

        if (!data) {
          throw new Error('No data returned from server');
        }

        return data as TeamAdminData;
      } catch (functionError: any) {
        console.error('Function invocation error:', functionError);
        
        // Handle different types of function errors
        if (functionError.message?.includes('FunctionsHttpError')) {
          throw new Error('Server error occurred while fetching team data. Please try again later.');
        }
        
        if (functionError.message?.includes('FunctionsRelayError')) {
          throw new Error('Network error occurred. Please check your connection and try again.');
        }
        
        if (functionError.message?.includes('FunctionsFetchError')) {
          throw new Error('Unable to connect to the server. Please try again later.');
        }
        
        // Re-throw the original error if it's already a custom error message
        if (functionError.message && !functionError.message.includes('Error')) {
          throw functionError;
        }
        
        throw new Error('An unexpected error occurred while fetching team data');
      }
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on permission or authentication errors
      if (error?.message?.includes('permission') || 
          error?.message?.includes('unauthorized') || 
          error?.message?.includes('not found')) {
        return false;
      }
      
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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