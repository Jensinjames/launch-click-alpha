// Query utilities for optimized React Query usage
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

// Query prefetching utilities
export const prefetchQueries = {
  // Prefetch user data on login
  userData: async (queryClient: QueryClient, userId: string) => {
    await Promise.all([
      // Prefetch with longer stale time for static data
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.plans,
        staleTime: 30 * 60 * 1000, // 30 minutes for plan data
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.credits,
        staleTime: 5 * 60 * 1000, // 5 minutes for credits
      }),
    ]);
  },

  // Prefetch dashboard data
  dashboardData: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.content.recent,
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.dashboard,
        staleTime: 15 * 60 * 1000, // 15 minutes
      }),
    ]);
  },
};

// Selective invalidation strategies
export const invalidationStrategies = {
  // When content is created/updated
  onContentChange: (queryClient: QueryClient, contentId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
    if (contentId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(contentId) });
    }
  },

  // When team membership changes
  onTeamChange: (queryClient: QueryClient, teamId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.analytics(teamId) });
    }
  },

  // When user plan changes
  onPlanChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.plans });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.credits });
    // Also invalidate feature access queries
    queryClient.invalidateQueries({ queryKey: ['feature-access'] });
  },
};

// Background refetch configuration
export const backgroundRefetchConfig = {
  // Static data - refetch less frequently
  static: {
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    staleTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Dynamic data - moderate refetch
  dynamic: {
    refetchInterval: 5 * 60 * 1000, // 5 minutes  
    staleTime: 15 * 60 * 1000, // 15 minutes
  },
  
  // Real-time data - frequent refetch
  realtime: {
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 60 * 1000, // 1 minute
  },
};