import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStatsData {
  totalUsers: number;
  newUsersThisMonth: number;
  onboardedUsers: number;
  activeTeams: number;
  totalContent: number;
  contentThisMonth: number;
  securityEvents: number;
  securityEventsChange: string;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStatsData> => {
      // Get user statistics
      const { data: userStats, error: userError } = await supabase
        .from('profiles')
        .select('created_at, onboarded')
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalUsers = userStats?.length || 0;
      const newUsersThisMonth = userStats?.filter(user => 
        new Date(user.created_at) >= thirtyDaysAgo
      ).length || 0;
      const onboardedUsers = userStats?.filter(user => user.onboarded).length || 0;

      // Get team statistics
      const { data: teamStats, error: teamError } = await supabase
        .from('teams')
        .select('created_at')
        .order('created_at', { ascending: false });

      if (teamError) throw teamError;

      const activeTeams = teamStats?.length || 0;

      // Get content statistics
      const { data: contentStats, error: contentError } = await supabase
        .from('generated_content')
        .select('created_at')
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      const totalContent = contentStats?.length || 0;
      const contentThisMonth = contentStats?.filter(content => 
        new Date(content.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Get security events from audit logs
      const { data: securityEvents, error: securityError } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('action', 'security_event')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (securityError) throw securityError;

      const securityEventsCount = securityEvents?.length || 0;

      // Calculate previous month for comparison
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const { data: prevSecurityEvents } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('action', 'security_event')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const prevSecurityEventsCount = prevSecurityEvents?.length || 0;
      const securityEventsChange = prevSecurityEventsCount > 0 
        ? `${Math.round(((securityEventsCount - prevSecurityEventsCount) / prevSecurityEventsCount) * 100)}%`
        : '+100%';

      return {
        totalUsers,
        newUsersThisMonth,
        onboardedUsers,
        activeTeams,
        totalContent,
        contentThisMonth,
        securityEvents: securityEventsCount,
        securityEventsChange
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
};