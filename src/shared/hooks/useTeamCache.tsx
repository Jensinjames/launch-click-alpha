import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { TeamService } from '../services/teamService';
import { TeamAnalytics, TeamNotification, TeamSettings } from '../types/teamWorkflow';

// Cache key factories
export const teamCacheKeys = {
  all: ['teams'] as const,
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

  const invalidateAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['teams', teamId, 'analytics'] 
    });
  }, [queryClient, teamId]);

  const prefetchOtherPeriods = useCallback(() => {
    const otherPeriods = (['7d', '30d', '90d'] as const).filter(p => p !== period);
    otherPeriods.forEach(p => {
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.analytics(teamId, p),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamAnalytics(teamId, p);
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [queryClient, teamId, period]);

  return {
    ...query,
    invalidateAnalytics,
    prefetchOtherPeriods,
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
      return data || [];
    },
    enabled: !!teamId,
    refetchInterval: 30 * 1000, // 30 seconds for real-time feel
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => TeamService.markNotificationAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamCacheKeys.notifications(teamId, false) });
      await queryClient.cancelQueries({ queryKey: teamCacheKeys.notifications(teamId, true) });

      // Snapshot previous values
      const previousAll = queryClient.getQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, false)
      );
      const previousUnread = queryClient.getQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, true)
      );

      // Optimistically update to the new value
      queryClient.setQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, false),
        (old) => old?.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        ) || []
      );

      queryClient.setQueryData<TeamNotification[]>(
        teamCacheKeys.notifications(teamId, true),
        (old) => old?.filter(n => n.id !== notificationId) || []
      );

      return { previousAll, previousUnread };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousAll) {
        queryClient.setQueryData(teamCacheKeys.notifications(teamId, false), context.previousAll);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(teamCacheKeys.notifications(teamId, true), context.previousUnread);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.notifications(teamId, false) });
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.notifications(teamId, true) });
    },
  });

  const unreadCount = useMemo(() => {
    const allNotifications = queryClient.getQueryData<TeamNotification[]>(
      teamCacheKeys.notifications(teamId, false)
    );
    return allNotifications?.filter(n => !n.read_at).length || 0;
  }, [queryClient, teamId]);

  return {
    ...query,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending
  };
};

// Hook for team settings with optimistic updates
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
        (old) => old ? {
          ...old,
          settings: { ...old.settings, ...newSettings },
          updated_at: new Date().toISOString()
        } : old
      );

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(teamCacheKeys.settings(teamId), context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamCacheKeys.settings(teamId) });
    },
  });

  return {
    ...query,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
};

// Global cache management utilities
export const useTeamCacheUtils = () => {
  const queryClient = useQueryClient();

  const invalidateAllTeamData = useCallback((teamId: string) => {
    queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
  }, [queryClient]);

  const clearTeamCache = useCallback((teamId: string) => {
    queryClient.removeQueries({ queryKey: ['teams', teamId] });
  }, [queryClient]);

  const prefetchTeamData = useCallback(async (teamId: string) => {
    // Prefetch commonly accessed data
    const promises = [
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.analytics(teamId, '30d'),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamAnalytics(teamId, '30d');
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.notifications(teamId, true),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamNotifications(teamId, true);
          if (error) throw error;
          return data || [];
        },
        staleTime: 1 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: teamCacheKeys.settings(teamId),
        queryFn: async () => {
          const { data, error } = await TeamService.getTeamSettings(teamId);
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000,
      })
    ];

    await Promise.allSettled(promises);
  }, [queryClient]);

  const getCachedTeamData = useCallback((teamId: string) => {
    return {
      analytics: queryClient.getQueryData(teamCacheKeys.analytics(teamId, '30d')),
      notifications: queryClient.getQueryData(teamCacheKeys.notifications(teamId, false)),
      settings: queryClient.getQueryData(teamCacheKeys.settings(teamId)),
    };
  }, [queryClient]);

  return {
    invalidateAllTeamData,
    clearTeamCache,
    prefetchTeamData,
    getCachedTeamData,
  };
};