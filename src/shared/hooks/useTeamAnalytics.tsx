import { useQuery } from '@tanstack/react-query';
import { TeamService } from '../services/teamService';
import { TeamAnalytics } from '../types/teamWorkflow';

export const useTeamAnalytics = (teamId: string, period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['team-analytics', teamId, period],
    queryFn: async (): Promise<TeamAnalytics> => {
      const { data, error } = await TeamService.getTeamAnalytics(teamId, period);
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};