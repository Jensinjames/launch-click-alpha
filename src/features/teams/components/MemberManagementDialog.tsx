
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, CreditCard, Trash2 } from "lucide-react";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useTeamMemberActions } from "@/hooks/useTeamMemberActions";

interface MemberManagementDialogProps {
  member: TeamMemberWithCredits;
  teamId: string;
  currentUserRole: string;
}

type MemberRole = "owner" | "admin" | "editor" | "viewer";

export const MemberManagementDialog = ({ 
  member, 
  teamId, 
  currentUserRole 
}: MemberManagementDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newRole, setNewRole] = useState<MemberRole>(member.role as MemberRole);
  const [creditsLimit, setCreditsLimit] = useState(member.credits.monthly_limit);
  
  const { updateRole, updateCredits, removeMember } = useTeamMemberActions(teamId);

  const canManageRole = currentUserRole === 'owner' && member.role !== 'owner';
  const canManageCredits = ['owner', 'admin'].includes(currentUserRole);
  const canRemoveMember = currentUserRole === 'owner' && member.role !== 'owner';

  const handleRoleUpdate = async () => {
    if (newRole !== member.role) {
      await updateRole.mutateAsync({ memberId: member.id, newRole });
      setIsOpen(false);
    }
  };

  const handleCreditsUpdate = async () => {
    if (creditsLimit !== member.credits.monthly_limit) {
      await updateCredits.mutateAsync({ memberId: member.id, creditsLimit });
      setIsOpen(false);
    }
  };

  const handleRemoveMember = async () => {
    if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      await removeMember.mutateAsync(member.id);
      setIsOpen(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setNewRole(value as MemberRole);
  };

  if (!canManageRole && !canManageCredits && !canRemoveMember) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {member.name}</DialogTitle>
          <DialogDescription>
            Update this team member's role, credit limit, or remove them from the team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {canManageRole && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={handleRoleChange}>
                <SelectTrigger id="member-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {newRole !== member.role && (
                <Button 
                  onClick={handleRoleUpdate} 
                  size="sm" 
                  disabled={updateRole.isPending}
                >
                  Update Role
                </Button>
              )}
            </div>
          )}

          {canManageCredits && (
            <div className="space-y-2">
              <Label htmlFor="credits">Monthly Credit Limit</Label>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-icon" />
                <Input
                  id="credits"
                  type="number"
                  value={creditsLimit}
                  onChange={(e) => setCreditsLimit(parseInt(e.target.value) || 0)}
                  min="0"
                  max="10000"
                />
              </div>
              {creditsLimit !== member.credits.monthly_limit && (
                <Button 
                  onClick={handleCreditsUpdate} 
                  size="sm" 
                  disabled={updateCredits.isPending}
                >
                  Update Credits
                </Button>
              )}
            </div>
          )}

          {canRemoveMember && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleRemoveMember}
                disabled={removeMember.isPending}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Team
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
