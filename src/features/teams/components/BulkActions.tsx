
import { Button } from "@/components/ui/button";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { BulkActionHeader } from "./bulk-actions/BulkActionHeader";
import { MemberSelectionGrid } from "./bulk-actions/MemberSelectionGrid";
import { BulkActionSelector } from "./bulk-actions/BulkActionSelector";
import { useBulkActionLogic } from "./bulk-actions/useBulkActionLogic";

interface BulkActionsProps {
  members: TeamMemberWithCredits[];
  teamId: string;
  currentUserRole: string;
}

export const BulkActions = ({ members, teamId, currentUserRole }: BulkActionsProps) => {
  const {
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
  } = useBulkActionLogic(teamId);

  const canBulkManage = ['owner', 'admin'].includes(currentUserRole);
  const selectableMembers = members.filter(m => m.role !== 'owner' && canBulkManage);

  if (!canBulkManage || selectableMembers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border-semantic rounded-lg bg-surface-elevated">
      <BulkActionHeader
        selectedCount={selectedMembers.length}
        totalCount={selectableMembers.length}
        onSelectAll={(checked) => handleSelectAll(checked, selectableMembers)}
      />

      <MemberSelectionGrid
        members={selectableMembers}
        selectedMembers={selectedMembers}
        onSelectMember={handleSelectMember}
      />

      {selectedMembers.length > 0 && (
        <div className="flex items-center space-x-4 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedMembers.length} selected
            </span>
          </div>

          <BulkActionSelector
            bulkAction={bulkAction}
            bulkRole={bulkRole}
            bulkCredits={bulkCredits}
            currentUserRole={currentUserRole}
            onActionChange={setBulkAction}
            onRoleChange={setBulkRole}
            onCreditsChange={setBulkCredits}
          />

          <Button
            onClick={executeBulkAction}
            disabled={isExecuteDisabled}
            variant={bulkAction === 'remove_members' ? 'destructive' : 'default'}
          >
            Execute
          </Button>
        </div>
      )}
    </div>
  );
};
