
import { useCreateTeam } from '@/features/teams/hooks/useCreateTeam';
import { useUpdateTeam } from '@/features/teams/hooks/useUpdateTeam';
import { useDeleteTeam } from '@/features/teams/hooks/useDeleteTeam';
import { useInviteMembers } from '@/features/teams/hooks/useInviteMembers';
import { useUpdateMemberRole } from '@/features/teams/hooks/useUpdateMemberRole';
import { useRemoveMember } from '@/features/teams/hooks/useRemoveMember';
import { useTransferOwnership } from '@/features/teams/hooks/useTransferOwnership';

export const useTeamMutations = () => {
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const inviteMembers = useInviteMembers();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMembers,
    updateMemberRole,
    removeMember,
    transferOwnership,
    
    // Consolidated state
    isLoading: createTeam.isPending || 
               updateTeam.isPending || 
               deleteTeam.isPending || 
               inviteMembers.isPending || 
               updateMemberRole.isPending || 
               removeMember.isPending || 
               transferOwnership.isPending,
    
    // Reset all mutations
    reset: () => {
      createTeam.reset();
      updateTeam.reset();
      deleteTeam.reset();
      inviteMembers.reset();
      updateMemberRole.reset();
      removeMember.reset();
      transferOwnership.reset();
    }
  };
};
