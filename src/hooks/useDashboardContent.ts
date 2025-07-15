import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export interface ContentMetrics {
  views: number;
  clicks: number;
  conversions: number;
  openRate?: number;
  ctr: number;
}

export interface CampaignData {
  id: string;
  title: string;
  type: 'email' | 'social' | 'landing';
  status: 'active' | 'draft' | 'completed';
  metrics: ContentMetrics;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}

export interface RecentActivity {
  id: string;
  user: TeamMember;
  action: string;
  target: string;
  timestamp: string;
  type: 'created' | 'edited' | 'completed' | 'commented';
}

export const useDashboardContent = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler({ context: { source: 'dashboard' } });

  // Fetch recent content performance data
  const contentPerformanceQuery = useQuery({
    queryKey: ['dashboard', 'content-performance', user?.id],
    queryFn: async (): Promise<CampaignData[]> => {
      if (!user) throw new Error('User not authenticated');

      try {
        // Get generated content with analytics
        const { data: contentData, error: contentError } = await supabase
          .from('generated_content')
          .select(`
            id,
            title,
            type,
            created_at,
            content_performance_summary (
              total_views,
              total_clicks,
              total_conversions,
              engagement_rate
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6);

        if (contentError) throw contentError;

        // Transform data to match CampaignData interface
        const campaigns: CampaignData[] = (contentData || []).map(item => ({
          id: item.id,
          title: item.title,
          type: mapContentTypeToDisplay(item.type),
          status: 'active', // TODO: Add status field to content table
          metrics: {
            views: Array.isArray(item.content_performance_summary) 
              ? (item.content_performance_summary[0]?.total_views || 0)
              : (item.content_performance_summary?.total_views || 0),
            clicks: Array.isArray(item.content_performance_summary)
              ? (item.content_performance_summary[0]?.total_clicks || 0)
              : (item.content_performance_summary?.total_clicks || 0),
            conversions: Array.isArray(item.content_performance_summary)
              ? (item.content_performance_summary[0]?.total_conversions || 0)
              : (item.content_performance_summary?.total_conversions || 0),
            ctr: Array.isArray(item.content_performance_summary)
              ? (item.content_performance_summary[0]?.engagement_rate || 0)
              : (item.content_performance_summary?.engagement_rate || 0),
            openRate: item.type === 'email_sequence' ? 
              (Array.isArray(item.content_performance_summary)
                ? (item.content_performance_summary[0]?.engagement_rate || 0)
                : (item.content_performance_summary?.engagement_rate || 0)) : undefined
          },
          createdAt: item.created_at
        }));

        return campaigns;
      } catch (error) {
        handleError(error as Error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    }
  });

  // Fetch team activity data
  const teamActivityQuery = useQuery({
    queryKey: ['dashboard', 'team-activity', user?.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!user) throw new Error('User not authenticated');

      try {
        // Get user activity data (simplified - no complex joins for now)
        const { data: activityData, error: activityError } = await supabase
          .from('user_activity_log')
          .select('id, action, resource_type, created_at, metadata, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (activityError) throw activityError;

        // Get user profile data separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        // Transform to RecentActivity format
        const activities: RecentActivity[] = (activityData || []).map(item => ({
          id: item.id,
          user: {
            id: user.id,
            name: profileData?.full_name || 'You',
            avatar: profileData?.avatar_url,
            role: 'Member',
            status: 'online' as const
          },
          action: formatAction(item.action),
          target: (typeof item.metadata === 'object' && item.metadata && 'target' in item.metadata) 
            ? String((item.metadata as { target: string }).target)
            : item.resource_type || 'Unknown',
          timestamp: formatTimestamp(item.created_at),
          type: mapActionToType(item.action)
        }));

        return activities;
      } catch (error) {
        handleError(error as Error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    }
  });

  return {
    contentPerformance: {
      data: contentPerformanceQuery.data || [],
      isLoading: contentPerformanceQuery.isLoading,
      error: contentPerformanceQuery.error,
      refetch: contentPerformanceQuery.refetch
    },
    teamActivity: {
      data: teamActivityQuery.data || [],
      isLoading: teamActivityQuery.isLoading,
      error: teamActivityQuery.error,
      refetch: teamActivityQuery.refetch
    },
    isLoading: contentPerformanceQuery.isLoading || teamActivityQuery.isLoading,
    refetchAll: () => {
      contentPerformanceQuery.refetch();
      teamActivityQuery.refetch();
    }
  };
};

// Helper functions
function mapContentTypeToDisplay(type: string): 'email' | 'social' | 'landing' {
  switch (type) {
    case 'email_sequence':
      return 'email';
    case 'social_post':
      return 'social';
    case 'landing_page':
      return 'landing';
    default:
      return 'landing';
  }
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase();
}

function mapActionToType(action: string): 'created' | 'edited' | 'completed' | 'commented' {
  if (action.includes('create')) return 'created';
  if (action.includes('edit') || action.includes('update')) return 'edited';
  if (action.includes('complete')) return 'completed';
  return 'commented';
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}