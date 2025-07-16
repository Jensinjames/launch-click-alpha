// Bulk Export Button Component - Multiple Content Export
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ExportService } from "@/services/exportService";

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
      const job = await ExportService.createExportJob(selectedContentIds, 'zip');
      
      toast.success(`Export job created! Processing ${selectedContentIds.length} items...`);
      
      // Monitor job status (simplified)
      setTimeout(async () => {
        const status = await ExportService.getJobStatus(job.id);
        if (status?.status === 'completed' && status.file_url) {
          toast.success('Export completed! Download started.');
          window.open(status.file_url, '_blank');
        }
      }, 5000);
      
      onExportComplete?.();
    } catch (error) {
      console.error('Bulk export error:', error);
      toast.error('Failed to start export job');
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