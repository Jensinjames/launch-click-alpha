
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, CreditCard, UserMinus } from "lucide-react";

interface BulkActionSelectorProps {
  bulkAction: string;
  bulkRole: string;
  bulkCredits: number;
  currentUserRole: string;
  onActionChange: (action: string) => void;
  onRoleChange: (role: string) => void;
  onCreditsChange: (credits: number) => void;
}

export const BulkActionSelector = ({
  bulkAction,
  bulkRole,
  bulkCredits,
  currentUserRole,
  onActionChange,
  onRoleChange,
  onCreditsChange
}: BulkActionSelectorProps) => {
  return (
    <div className="flex items-center space-x-4">
      <Select value={bulkAction} onValueChange={onActionChange}>
        <SelectTrigger id="bulk-action-select" className="w-48">
          <SelectValue placeholder="Choose action..." />
        </SelectTrigger>
        <SelectContent>
          {currentUserRole === 'owner' && (
            <SelectItem value="update_role">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Update Role
              </div>
            </SelectItem>
          )}
          <SelectItem value="update_credits">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Update Credits
            </div>
          </SelectItem>
          {currentUserRole === 'owner' && (
            <SelectItem value="remove_members">
              <div className="flex items-center">
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Members
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {bulkAction === 'update_role' && (
        <Select value={bulkRole} onValueChange={onRoleChange}>
          <SelectTrigger id="bulk-role-select" className="w-32">
            <SelectValue placeholder="Role..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      )}

      {bulkAction === 'update_credits' && (
        <Input
          type="number"
          placeholder="Credits"
          value={bulkCredits || ''}
          onChange={(e) => onCreditsChange(parseInt(e.target.value) || 0)}
          className="w-24"
          min="0"
          max="10000"
        />
      )}
    </div>
  );
};
