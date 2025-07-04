
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";

interface BulkActionHeaderProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
}

export const BulkActionHeader = ({
  selectedCount,
  totalCount,
  onSelectAll
}: BulkActionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Bulk Actions
      </h3>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="select-all"
          checked={selectedCount === totalCount}
          onCheckedChange={onSelectAll}
        />
        <label htmlFor="select-all" className="text-sm">
          Select All ({totalCount})
        </label>
      </div>
    </div>
  );
};
