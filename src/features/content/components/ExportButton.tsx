// Export Button Component - Single Content Export
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

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
      // TODO: Implement actual export functionality
      toast.success(`Exporting "${contentTitle}"`);
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