import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useContentExport } from '@/hooks/useContentExport';
import FeatureGate from '@/components/shared/FeatureGate';

interface ExportButtonProps {
  contentId: string;
  contentTitle: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export const ExportButton = ({
  contentId,
  contentTitle,
  variant = 'outline',
  size = 'sm',
  showText = false
}: ExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [template, setTemplate] = useState<'default' | 'branded'>('default');
  
  const exportMutation = useContentExport();

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        contentId,
        format,
        template
      });
      setOpen(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <FeatureGate featureName="content_export_pdf">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <Download className="h-4 w-4" />
            {showText && 'Export'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export Content
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-secondary">Content</Label>
              <p className="text-sm text-tertiary truncate">{contentTitle}</p>
            </div>

            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={(value: 'pdf' | 'docx') => setFormat(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Template Style</Label>
              <Select value={template} onValueChange={(value: 'default' | 'branded') => setTemplate(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Layout</SelectItem>
                  <SelectItem value="branded">Branded Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={exportMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="gap-2"
              >
                {exportMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Export {format.toUpperCase()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FeatureGate>
  );
};