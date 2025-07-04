import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamService } from '../services/teamService';
import { TeamNotification } from '../types';

export const useTeamNotifications = (teamId: string, unreadOnly = false) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['team-notifications', teamId, unreadOnly],
    queryFn: async (): Promise<TeamNotification[]> => {
      const { data, error } = await TeamService.getTeamNotifications(teamId, unreadOnly);
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => TeamService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-notifications', teamId] });
    },
  });

  return {
    notifications,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};