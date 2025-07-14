// Bulk Export Button Component - Multiple Content Export
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BulkExportButtonProps {
  selectedContentIds: string[];
  onExportComplete?: () => void;
}

export const BulkExportButton = ({ 
  selectedContentIds, 
  onExportComplete 
}: BulkExportButtonProps) => {
  const handleBulkExport = async () => {
    try {
      // TODO: Implement actual bulk export functionality
      toast.success(`Exporting ${selectedContentIds.length} items`);
      onExportComplete?.();
    } catch (error) {
      console.error('Bulk export error:', error);
      toast.error('Failed to export content');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleBulkExport}
      disabled={selectedContentIds.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export ({selectedContentIds.length})
    </Button>
  );
};