import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamAdminData, TeamMemberWithCredits } from '@/types/team';

// Helper function to test network connectivity
const testConnectivity = async (): Promise<boolean> => {
  try {
    // Test basic connectivity to Supabase
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabase.supabaseKey,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Connectivity test failed:', error);
    return false;
  }
};

// Fallback function to get team data using direct database queries
const getFallbackTeamData = async (teamId: string): Promise<TeamAdminData> => {
  console.log('Using fallback method to fetch team data...');
  
  // Get team members with their profiles and credits
  const { data: teamMembers, error: membersError } = await supabase
    .from('team_members')
    .select(`
      id,
      role,
      status,
      joined_at,
      user_id,
      profiles!inner (
        id,
        full_name,
        email,
        avatar_url
      ),
      user_credits!inner (
        monthly_limit,
        credits_used,
        reset_at
      )
    `)
    .eq('team_id', teamId)
    .eq('status', 'active');

  if (membersError) {
    throw new Error(`Failed to fetch team members: ${membersError.message}`);
  }

  if (!teamMembers || teamMembers.length === 0) {
    throw new Error('No team members found or you do not have access to this team');
  }

  // Transform the data to match expected format
  const members: TeamMemberWithCredits[] = teamMembers.map(member => ({
    id: member.user_id,
    name: member.profiles.full_name || member.profiles.email,
    email: member.profiles.email,
    role: member.role,
    status: member.status,
    avatar_url: member.profiles.avatar_url,
    joined_at: member.joined_at,
    credits: {
      monthly_limit: member.user_credits.monthly_limit,
      credits_used: member.user_credits.credits_used,
      reset_at: member.user_credits.reset_at,
    },
  }));

  // Get team info
  const { data: teamInfo, error: teamError } = await supabase
    .from('teams')
    .select('id, name, owner_id')
    .eq('id', teamId)
    .single();

  if (teamError) {
    throw new Error(`Failed to fetch team info: ${teamError.message}`);
  }

  return {
    team: teamInfo,
    members,
    total_members: members.length,
  };
};

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

      // First, test basic connectivity
      const isConnected = await testConnectivity();
      if (!isConnected) {
        console.warn('Network connectivity issues detected, using fallback method');
        return getFallbackTeamData(teamId);
      }

      try {
        console.log('Attempting to call Edge Function...');
        
        const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
          body: { team_id: teamId },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Edge function error details:', error);
          
          // Check if this is a network/connectivity error
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('NetworkError') ||
              error.message?.includes('fetch')) {
            console.warn('Network error detected, falling back to direct database queries');
            return getFallbackTeamData(teamId);
          }
          
          // Extract more specific error information from the response
          let errorMessage = 'Unknown error occurred';
          
          if (error.message) {
            errorMessage = error.message;
          }
          
          if (error.context) {
            console.error('Error context:', error.context);
          }
          
          // Handle different HTTP status codes if available
          if (error.status) {
            switch (error.status) {
              case 401:
                throw new Error('Authentication required. Please log in again.');
              case 403:
                throw new Error('You do not have permission to view this team\'s data. You must be a team owner or admin.');
              case 404:
                throw new Error('Team not found or you do not have access to it.');
              case 500:
                throw new Error('Server error occurred. Please try again later.');
              default:
                throw new Error(`Server returned error (${error.status}): ${errorMessage}`);
            }
          }
          
          // Provide more specific error messages based on the error message content
          if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('unauthorized')) {
            throw new Error('You do not have permission to view this team\'s data. You must be a team owner or admin.');
          }
          
          if (errorMessage.toLowerCase().includes('not found')) {
            throw new Error('Team not found or you do not have access to it.');
          }
          
          if (errorMessage.toLowerCase().includes('forbidden')) {
            throw new Error('Access denied. You must be a team owner or admin to view this data.');
          }
          
          throw new Error(`Failed to fetch team data: ${errorMessage}`);
        }

        if (!data) {
          throw new Error('No data returned from server');
        }

        console.log('Edge function call successful');
        return data as TeamAdminData;
        
      } catch (functionError: any) {
        console.error('Function invocation error:', functionError);
        
        // Check if this is a network connectivity error and use fallback
        if (functionError.message?.includes('Failed to fetch') ||
            functionError.message?.includes('NetworkError') ||
            functionError.message?.includes('fetch') ||
            functionError.name === 'TypeError') {
          console.warn('Network error during Edge Function call, using fallback method');
          return getFallbackTeamData(teamId);
        }
        
        // If it's already a custom error message, re-throw it
        if (functionError.message && !functionError.message.includes('FunctionsError')) {
          throw functionError;
        }
        
        // Handle different types of Supabase function errors
        if (functionError.message?.includes('FunctionsHttpError')) {
          // Try to extract status code from the error
          const statusMatch = functionError.message.match(/status (\d+)/);
          const status = statusMatch ? parseInt(statusMatch[1]) : null;
          
          switch (status) {
            case 401:
              throw new Error('Authentication required. Please log in again.');
            case 403:
              throw new Error('You do not have permission to view this team\'s data. You must be a team owner or admin.');
            case 404:
              throw new Error('Team not found or you do not have access to it.');
            case 500:
              throw new Error('Server error occurred. Please try again later.');
            default:
              throw new Error(`Server error occurred (${status || 'unknown'}). Please try again later.`);
          }
        }
        
        if (functionError.message?.includes('FunctionsRelayError')) {
          console.warn('Network relay error, using fallback method');
          return getFallbackTeamData(teamId);
        }
        
        if (functionError.message?.includes('FunctionsFetchError')) {
          console.warn('Function fetch error, using fallback method');
          return getFallbackTeamData(teamId);
        }
        
        // Generic fallback error - try the fallback method one more time
        console.warn('Unexpected error, attempting fallback method');
        try {
          return getFallbackTeamData(teamId);
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
          throw new Error('Unable to fetch team data. Please check your connection and try again.');
        }
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
          error?.message?.includes('not found') ||
          error?.message?.includes('Access denied') ||
          error?.message?.includes('Authentication required')) {
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