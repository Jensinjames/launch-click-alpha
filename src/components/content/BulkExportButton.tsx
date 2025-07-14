import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Loader2 } from 'lucide-react';
import { useBulkContentExport } from '@/hooks/useContentExport';
import FeatureGate from '@/components/shared/FeatureGate';

interface BulkExportButtonProps {
  selectedContentIds: string[];
  onExportComplete?: () => void;
}

export const BulkExportButton = ({
  selectedContentIds,
  onExportComplete
}: BulkExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'text' | 'pdf'>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  
  const bulkExportMutation = useBulkContentExport();

  const handleBulkExport = async () => {
    try {
      await bulkExportMutation.mutateAsync({
        contentIds: selectedContentIds,
        format,
        includeMetadata
      });
      setOpen(false);
      onExportComplete?.();
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  if (selectedContentIds.length === 0) {
    return null;
  }

  return (
    <FeatureGate featureName="content_export_bulk">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Export Selected ({selectedContentIds.length})
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Bulk Export
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-secondary">Selected Items</Label>
              <p className="text-sm text-tertiary">
                {selectedContentIds.length} content piece{selectedContentIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={(value: 'json' | 'text' | 'pdf') => setFormat(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON Archive</SelectItem>
                  <SelectItem value="text">Text Files</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-tertiary mt-1">
                All files will be packaged in a ZIP archive
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeMetadata" 
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
              />
              <Label 
                htmlFor="includeMetadata"
                className="text-sm font-normal cursor-pointer"
              >
                Include metadata (prompts, tags, creation date)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={bulkExportMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkExport}
                disabled={bulkExportMutation.isPending}
                className="gap-2"
              >
                {bulkExportMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Export ZIP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FeatureGate>
  );
};