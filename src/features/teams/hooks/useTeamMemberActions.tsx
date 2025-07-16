
import { useUpdateMemberRole } from '@/features/teams/hooks/useUpdateMemberRole';
import { useRemoveMember } from '@/features/teams/hooks/useRemoveMember';
import { supabase } from '@/integrations/supabase/client';

export const useTeamMemberActions = (teamId: string) => {
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  const updateRole = {
    mutate: ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      updateRoleMutation.mutate({ teamId, memberId, newRole });
    },
    mutateAsync: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      return updateRoleMutation.mutateAsync({ teamId, memberId, newRole });
    },
    isPending: updateRoleMutation.isPending
  };

  const updateCredits = {
    mutate: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // Call the admin edge function to update credits
      const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
        body: { 
          action: 'update_member_credits',
          member_id: memberId, 
          credits_limit: creditsLimit 
        }
      });
      
      if (error) {
        throw new Error('Failed to update credits');
      }
      
      return data;
    },
    mutateAsync: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      return updateCredits.mutate({ memberId, creditsLimit });
    },
    isPending: false
  };

  const removeMember = {
    mutate: (memberId: string) => {
      removeMemberMutation.mutate({ teamId, memberId });
    },
    mutateAsync: async (memberId: string) => {
      return removeMemberMutation.mutateAsync({ teamId, memberId });
    },
    isPending: removeMemberMutation.isPending
  };

  return {
    updateRole,
    updateCredits,
    removeMember,
    isLoading: updateRoleMutation.isPending || removeMemberMutation.isPending
  };
};
