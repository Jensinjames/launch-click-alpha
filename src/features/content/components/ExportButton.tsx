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
      toast.loading('Generating PDF export...', { id: 'export-loading' });
      const result = await ExportService.exportSingleContent(contentId, 'pdf');
      
      toast.dismiss('export-loading');
      
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
    } catch (error: any) {
      toast.dismiss('export-loading');
      console.error('Export error:', error);
      
      // Enhanced error messaging
      if (error?.message?.includes('Pro plan')) {
        toast.error('PDF export requires Pro plan or higher. Please upgrade your account.');
      } else if (error?.message?.includes('Authentication')) {
        toast.error('Please log in to export content.');
      } else {
        toast.error('Failed to export content. Please try again.');
      }
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