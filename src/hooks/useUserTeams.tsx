
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserTeam {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export const useUserTeams = () => {
  return useQuery({
    queryKey: ['user-teams'],
    queryFn: async (): Promise<UserTeam[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be authenticated');
      }

      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          role,
          created_at,
          teams!fk_team_members_team (
            id,
            name
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user teams:', error);
        throw new Error('Failed to fetch teams');
      }

      return teamMembers?.map(member => ({
        id: (member.teams as any)?.id,
        name: (member.teams as any)?.name,
        role: member.role,
        created_at: member.created_at
      })) || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
