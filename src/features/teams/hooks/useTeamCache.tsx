import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { TeamService } from '../services/teamService';
import { TeamAnalytics, TeamNotification, TeamSettings } from '../types';

// Centralized cache key factory
const teamCacheKeys = {
  analytics: (teamId: string, period: string) => ['teams', teamId, 'analytics', period] as const,
  notifications: (teamId: string, unreadOnly: boolean) => ['teams', teamId, 'notifications', unreadOnly] as const,
  settings: (teamId: string) => ['teams', teamId, 'settings'] as const,
  members: (teamId: string) => ['teams', teamId, 'members'] as const,
  templates: (category?: string) => ['teams', 'templates', category] as const,
};

// Hook for team analytics with intelligent caching
export const useTeamAnalyticsCache = (teamId: string, period: '7d' | '30d' | '90d' = '30d') => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: teamCacheKeys.analytics(teamId, period),
    queryFn: async (): Promise<TeamAnalytics> => {
      const { data, error } = await TeamService.getTeamAnalytics(teamId, period);
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Prefetch related periods
  const prefetchRelatedPeriods = useCallback(() => {
    const periods = ['7d', '30d', '90d'] as const;
    periods.forEach(p => {
      if (p !== period) {
        queryClient.prefetchQuery({
          queryKey: teamCacheKeys.analytics(teamId, p),
          queryFn: async () => {
            const { data, error } = await TeamService.getTeamAnalytics(teamId, p);
            if (error) throw error;
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    });
  }, [queryClient, teamId, period]);

  return {
    ...query,
    prefetchRelatedPeriods,
  };
};

// Hook for team notifications with optimistic updates
export const useTeamNotificationsCache = (teamId: string, unreadOnly = false) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: teamCacheKeys.notifications(teamId, unreadOnly),
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
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamCacheKeys.notifications(teamId, unreadOnly) });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, unreadOnly)
      );

      // Optimistically update to the new value
      queryClient.setQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, unreadOnly),
        old => old?.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        ) || []
      );

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        teamCacheKeys.notifications(teamId, unreadOnly),
        context?.previousNotifications
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.notifications(teamId, false) });
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.notifications(teamId, true) });
    },
  });

  return {
    ...query,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};

// Hook for team settings with auto-save capabilities
export const useTeamSettingsCache = (teamId: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: teamCacheKeys.settings(teamId),
    queryFn: async (): Promise<TeamSettings | null> => {
      const { data, error } = await TeamService.getTeamSettings(teamId);
      if (error) throw error;
      return data as TeamSettings | null;
    },
    enabled: !!teamId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<TeamSettings['settings']>) => 
      TeamService.updateTeamSettings(teamId, settings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: teamCacheKeys.settings(teamId) });

      const previousSettings = queryClient.getQueryData<TeamSettings>(
        teamCacheKeys.settings(teamId)
      );

      queryClient.setQueryData<TeamSettings>(
        teamCacheKeys.settings(teamId),
        old => old ? {
          ...old,
          settings: { ...old.settings, ...newSettings },
          updated_at: new Date().toISOString()
        } : old
      );

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      queryClient.setQueryData(
        teamCacheKeys.settings(teamId),
        context?.previousSettings
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.settings(teamId) });
    },
  });

  return {
    ...query,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

// Global cache management utilities
export const useTeamCacheUtils = () => {
  const queryClient = useQueryClient();

  const invalidateAllTeamData = useCallback((teamId: string) => {
    queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
  }, [queryClient]);

  const prefetchTeamDashboard = useCallback(async (teamId: string) => {
    // Prefetch commonly accessed data for team dashboard
    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.analytics(teamId, '30d'),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamAnalytics(teamId, '30d');
          if (error) throw error;
          return data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.notifications(teamId, true),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamNotifications(teamId, true);
          if (error) throw error;
          return data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.settings(teamId),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamSettings(teamId);
          if (error) throw error;
          return data;
        },
      }),
    ];

    await Promise.all(prefetchPromises);
  }, [queryClient]);

  const getCachedTeamAnalytics = useCallback((teamId: string, period: string) => {
    return queryClient.getQueryData<TeamAnalytics>(
      teamCacheKeys.analytics(teamId, period)
    );
  }, [queryClient]);

  const setCachedTeamAnalytics = useCallback((teamId: string, period: string, data: TeamAnalytics) => {
    queryClient.setQueryData(teamCacheKeys.analytics(teamId, period), data);
  }, [queryClient]);

  return {
    invalidateAllTeamData,
    prefetchTeamDashboard,
    getCachedTeamAnalytics,
    setCachedTeamAnalytics,
    cacheKeys: teamCacheKeys,
  };
};