import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";

interface OptimizedDashboardData {
  credits: {
    used: number;
    limit: number;
  };
  recentAssets: any[];
  assetsCount: number;
  teamCount: number;
  performanceMetrics: {
    loadTime: number;
    cacheHit: boolean;
  };
}

// Batch multiple dashboard queries into one efficient call
const fetchDashboardDataBatch = async (userId: string): Promise<OptimizedDashboardData> => {
  const startTime = performance.now();
  
  try {
    // Use the existing optimized RPC function
    const { data: dashboardData, error } = await supabase.rpc('get_dashboard_data', {
      user_uuid: userId
    });
    
    if (error) throw error;
    
    // Get additional data in parallel
    const [
      { count: assetsCount },
      { count: teamCount }
    ] = await Promise.all([
      supabase
        .from('generated_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
    ]);

    const loadTime = performance.now() - startTime;
    
    // Type-safe extraction of dashboard data
    const typedData = dashboardData as any;
    
    return {
      credits: typedData?.credits || { used: 0, limit: 50 },
      recentAssets: typedData?.recentAssets || [],
      assetsCount: assetsCount || 0,
      teamCount: teamCount || 0,
      performanceMetrics: {
        loadTime,
        cacheHit: false
      }
    };
  } catch (error) {
    console.error('Dashboard batch fetch failed:', error);
    // Return safe defaults
    return {
      credits: { used: 0, limit: 50 },
      recentAssets: [],
      assetsCount: 0,
      teamCount: 0,
      performanceMetrics: {
        loadTime: performance.now() - startTime,
        cacheHit: false
      }
    };
  }
};

export const useOptimizedDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Check cache first for immediate response
  const [cachedData, setCachedData] = useState<OptimizedDashboardData | null>(null);
  
  const query = useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: async (): Promise<OptimizedDashboardData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Check if we have cached data for immediate response
      const cached = queryClient.getQueryData<OptimizedDashboardData>(queryKeys.analytics.dashboard);
      if (cached && cachedData !== cached) {
        setCachedData(cached);
      }
      
      const result = await fetchDashboardDataBatch(user.id);
      
      // Mark as cache hit if we had previous data
      if (cached) {
        result.performanceMetrics.cacheHit = true;
      }
      
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes for dashboard data
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Only refetch when user actively needs fresh data
    refetchInterval: false,
    // Optimize retry strategy
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('auth') || error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Memoized selectors to prevent unnecessary re-renders
  const selectors = useMemo(() => ({
    credits: query.data?.credits || { used: 0, limit: 50 },
    recentAssets: query.data?.recentAssets || [],
    assetsCount: query.data?.assetsCount || 0,
    teamCount: query.data?.teamCount || 0,
    isOptimized: !!query.data?.performanceMetrics.cacheHit,
    loadTime: query.data?.performanceMetrics.loadTime || 0,
  }), [query.data]);

  // Manual refresh function for user-triggered updates
  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  // Prefetch related data when dashboard loads successfully
  useEffect(() => {
    if (query.data && !query.isLoading && user?.id) {
      // Prefetch content list in the background
      queryClient.prefetchQuery({
        queryKey: queryKeys.content.recent,
        queryFn: () => supabase
          .from('generated_content')
          .select('id, title, type, created_at, is_favorite')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [query.data, query.isLoading, user?.id, queryClient]);

  return {
    ...selectors,
    isLoading: query.isLoading,
    error: query.error,
    refresh,
    // Performance debugging info (dev only)
    debug: import.meta.env.DEV ? {
      queryKey: queryKeys.analytics.dashboard,
      cacheStatus: query.isFetching ? 'fetching' : query.isStale ? 'stale' : 'fresh',
      lastFetch: query.dataUpdatedAt,
    } : undefined
  };
};