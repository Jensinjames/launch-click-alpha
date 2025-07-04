
import { Checkbox } from "@/components/ui/checkbox";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";

interface MemberSelectionGridProps {
  members: TeamMemberWithCredits[];
  selectedMembers: string[];
  onSelectMember: (memberId: string, checked: boolean) => void;
}

export const MemberSelectionGrid = ({
  members,
  selectedMembers,
  onSelectMember
}: MemberSelectionGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
      {members.map((member) => (
        <div key={member.id} className="flex items-center space-x-2">
          <Checkbox
            id={`member-${member.id}`}
            checked={selectedMembers.includes(member.id)}
            onCheckedChange={(checked) => onSelectMember(member.id, !!checked)}
          />
          <label htmlFor={`member-${member.id}`} className="text-sm truncate">
            {member.name}
          </label>
        </div>
      ))}
    </div>
  );
};
