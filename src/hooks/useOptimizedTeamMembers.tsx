import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamAdminData, TeamMemberWithCredits } from '@/types/team';
import { teamsLogger } from '@/services/logger/domainLoggers';

// Simplified helper to try edge function first, fallback to direct query
const getTeamDataWithFallback = async (teamId: string): Promise<TeamAdminData> => {
  try {
    // Try edge function first
    const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
      body: { team_id: teamId },
    });

    if (error) throw error;
    if (data) return data as TeamAdminData;
  } catch (error) {
    // Use teams logger for structured logging
    teamsLogger.warning('Edge function failed, using fallback', { error: (error as Error).message });
  }
  
  // Fallback to direct database query
  return getFallbackTeamData(teamId);
};

// Fallback function to get team data using direct database queries
const getFallbackTeamData = async (teamId: string): Promise<TeamAdminData> => {
  // Use teams logger for structured logging
  teamsLogger.info('Using fallback method to fetch team data', { teamId });
  
  // Get team members with their profiles and credits
  const { data: teamMembers, error: membersError } = await supabase
    .from('team_members')
    .select(`
      id,
      role,
      status,
      joined_at,
      created_at,
      user_id,
      profiles!fk_team_members_user (
        id,
        full_name,
        email,
        avatar_url
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

  // Get credits for each user separately
  const userIds = teamMembers.map(m => m.user_id);
  const { data: userCredits, error: creditsError } = await supabase
    .from('user_credits')
    .select('user_id, monthly_limit, credits_used, reset_at')
    .in('user_id', userIds);

  if (creditsError) {
    throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
  }

  // Create a map for easy lookup
  const creditsMap = new Map(
    (userCredits || []).map(credit => [credit.user_id, credit])
  );

  // Transform the data to match expected format
  const members: TeamMemberWithCredits[] = teamMembers.map(member => {
    const userCredit = creditsMap.get(member.user_id) || {
      monthly_limit: 50,
      credits_used: 0,
      reset_at: new Date().toISOString()
    };
    
    return {
      id: member.id,
      user_id: member.user_id,
      name: member.profiles?.full_name || member.profiles?.email || 'Unknown User',
      email: member.profiles?.email || '',
      role: member.role,
      status: member.status as 'active' | 'pending' | 'inactive',
      avatar_url: member.profiles?.avatar_url,
      created_at: member.created_at,
      joined_at: member.joined_at,
      credits: {
        monthly_limit: userCredit.monthly_limit,
        credits_used: userCredit.credits_used,
        credits_remaining: userCredit.monthly_limit - userCredit.credits_used,
        reset_at: userCredit.reset_at,
      },
    };
  });

  // Get team info
  const { data: teamInfo, error: teamError } = await supabase
    .from('teams')
    .select('id, name, owner_id, created_at, updated_at')
    .eq('id', teamId)
    .single();

  if (teamError) {
    throw new Error(`Failed to fetch team info: ${teamError.message}`);
  }

  return {
    team: teamInfo,
    members,
    statistics: {
      total_members: members.length,
      active_members: members.filter(m => m.status === 'active').length,
      pending_invites: 0, // This would need to be calculated separately
      total_credits_used: members.reduce((sum, m) => sum + m.credits.credits_used, 0),
      total_credits_available: members.reduce((sum, m) => sum + m.credits.monthly_limit, 0),
      credits_utilization: `${Math.round((members.reduce((sum, m) => sum + m.credits.credits_used, 0) / members.reduce((sum, m) => sum + m.credits.monthly_limit, 0)) * 100)}%`,
    },
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

      return getTeamDataWithFallback(teamId);
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

    return {
      ...data,
      members: sortedMembers,
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