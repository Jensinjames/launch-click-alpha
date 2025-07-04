
import { useState } from "react";
import { useTeamMemberActions } from "@/hooks/useTeamMemberActions";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { toast } from "sonner";

export const useBulkActionLogic = (teamId: string) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkRole, setBulkRole] = useState<string>('');
  const [bulkCredits, setBulkCredits] = useState<number>(0);

  const { updateRole, updateCredits, removeMember } = useTeamMemberActions(teamId);

  const handleSelectAll = (checked: boolean, selectableMembers: TeamMemberWithCredits[]) => {
    if (checked) {
      setSelectedMembers(selectableMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const executeBulkAction = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    if (!bulkAction) {
      toast.error('Please select an action');
      return;
    }

    try {
      const promises = selectedMembers.map(async (memberId) => {
        switch (bulkAction) {
          case 'update_role':
            if (!bulkRole) {
              throw new Error('Please select a role');
            }
            return updateRole.mutateAsync({ memberId, newRole: bulkRole });
          
          case 'update_credits':
            if (!bulkCredits || bulkCredits <= 0) {
              throw new Error('Please enter a valid credit amount');
            }
            return updateCredits.mutateAsync({ memberId, creditsLimit: bulkCredits });
          
          case 'remove_members':
            return removeMember.mutateAsync(memberId);
          
          default:
            throw new Error('Invalid action');
        }
      });

      await Promise.all(promises);
      toast.success(`Bulk action completed for ${selectedMembers.length} members`);
      setSelectedMembers([]);
      setBulkAction('');
      setBulkRole('');
      setBulkCredits(0);
      
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error(error.message || 'Failed to execute bulk action');
    }
  };

  const isExecuteDisabled = 
    !bulkAction ||
    (bulkAction === 'update_role' && !bulkRole) ||
    (bulkAction === 'update_credits' && (!bulkCredits || bulkCredits <= 0)) ||
    updateRole.isPending ||
    updateCredits.isPending ||
    removeMember.isPending;

  return {
    selectedMembers,
    bulkAction,
    bulkRole,
    bulkCredits,
    setBulkAction,
    setBulkRole,
    setBulkCredits,
    handleSelectAll,
    handleSelectMember,
    executeBulkAction,
    isExecuteDisabled
  };
};
