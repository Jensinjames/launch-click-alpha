import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamService } from '../services/teamService';
import { TeamNotification } from '../types/teamWorkflow';

export const useTeamNotifications = (teamId: string, unreadOnly = false) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['team-notifications', teamId, unreadOnly],
    queryFn: async (): Promise<TeamNotification[]> => {
      const { data, error } = await TeamService.getTeamNotifications(teamId, unreadOnly);
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
    refetchInterval: 30 * 1000, // 30 seconds for real-time feel
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => TeamService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending
  };
};