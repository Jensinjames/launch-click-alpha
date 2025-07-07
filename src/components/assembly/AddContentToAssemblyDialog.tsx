import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useAddContentToAssembly, useAssemblyWithContent } from '@/hooks/useContentAssembly';
import { useUserContent } from '@/hooks/useUserContent';
import type { ContentAssembly } from '@/types/assembly';

interface AddContentToAssemblyDialogProps {
  assembly: ContentAssembly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddContentToAssemblyDialog = ({ assembly, open, onOpenChange }: AddContentToAssemblyDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: allContent } = useUserContent();
  const { data: assemblyData } = useAssemblyWithContent(assembly?.id || null);
  const addContentToAssembly = useAddContentToAssembly();

  // Filter out content already in the assembly
  const existingContentIds = assemblyData?.content?.map(item => item.content.id) || [];
  const availableContent = allContent?.filter(content => 
    !existingContentIds.includes(content.id) &&
    (searchQuery === '' || 
     content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     content.type.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleClose = () => {
    onOpenChange(false);
    setSelectedIds([]);
    setSearchQuery('');
  };

  const toggleContentSelection = (contentId: string) => {
    setSelectedIds(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleAddContent = async () => {
    if (!assembly || selectedIds.length === 0) return;
    
    try {
      await addContentToAssembly.mutateAsync({
        assemblyId: assembly.id,
        contentIds: selectedIds
      });
      handleClose();
    } catch (error) {
      console.error('Failed to add content to assembly:', error);
    }
  };

  const getContentTypeColor = (type: string) => {
    const colors = {
      'email_sequence': 'bg-blue-100 text-blue-800',
      'social_post': 'bg-green-100 text-green-800',
      'landing_page': 'bg-purple-100 text-purple-800',
      'blog_post': 'bg-orange-100 text-orange-800',
      'ad_copy': 'bg-red-100 text-red-800',
      'funnel': 'bg-indigo-100 text-indigo-800',
      'strategy_brief': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!assembly) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Content to Assembly
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content List */}
          <ScrollArea className="h-64">
            {availableContent.length > 0 ? (
              <div className="space-y-2">
                {availableContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer border"
                    onClick={() => toggleContentSelection(item.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onChange={() => {}}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{item.title}</h4>
                        <Badge variant="outline" className={getContentTypeColor(item.type)}>
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>
                  {searchQuery 
                    ? `No content found matching "${searchQuery}"`
                    : existingContentIds.length > 0 
                      ? "All your content is already in this assembly"
                      : "No content available to add"
                  }
                </p>
              </div>
            )}
          </ScrollArea>
          
          {selectedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} content piece{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={addContentToAssembly.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddContent}
              disabled={addContentToAssembly.isPending || selectedIds.length === 0}
            >
              {addContentToAssembly.isPending ? 'Adding...' : `Add ${selectedIds.length} Item${selectedIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};