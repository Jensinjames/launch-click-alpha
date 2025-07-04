
import { useUpdateMemberRole } from '@/features/teams/hooks/useUpdateMemberRole';
import { useRemoveMember } from '@/features/teams/hooks/useRemoveMember';

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
    mutate: ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // TODO: Implement credits update functionality
      console.log('Update member credits:', { memberId, creditsLimit });
    },
    mutateAsync: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // TODO: Implement credits update functionality
      console.log('Update member credits:', { memberId, creditsLimit });
      return Promise.resolve();
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
