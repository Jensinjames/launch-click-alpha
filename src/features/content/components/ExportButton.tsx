// Export Button Component - Single Content Export
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ExportService } from "@/services/exportService";

interface ExportButtonProps {
  contentId: string;
  contentTitle: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const ExportButton = ({ 
  contentId, 
  contentTitle, 
  size = "default",
  variant = "outline"
}: ExportButtonProps) => {
  const handleExport = async () => {
    try {
      const result = await ExportService.exportSingleContent(contentId, 'pdf');
      
      if (result?.file_url) {
        // Download the file
        const link = document.createElement('a');
        link.href = result.file_url;
        link.download = `${contentTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Successfully exported "${contentTitle}"`);
      } else {
        toast.error('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export content');
    }
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleExport}
    >
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
};