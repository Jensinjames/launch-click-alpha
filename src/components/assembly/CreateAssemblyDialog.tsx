import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { Layers, Plus } from 'lucide-react';
import { useCreateAssembly } from '@/hooks/useContentAssembly';
import { useUserContent } from '@/hooks/useUserContent';
import type { CreateAssemblyRequest } from '@/types/assembly';

interface CreateAssemblyDialogProps {
  trigger?: React.ReactNode;
  selectedContentIds?: string[];
  onClose?: () => void;
}

export const CreateAssemblyDialog = ({ 
  trigger, 
  selectedContentIds = [],
  onClose 
}: CreateAssemblyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedContentIds);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAssemblyRequest>();
  const createAssembly = useCreateAssembly();
  const { data: content } = useUserContent();

  const handleClose = () => {
    setOpen(false);
    setSelectedIds(selectedContentIds);
    reset();
    onClose?.();
  };

  const onSubmit = async (data: CreateAssemblyRequest) => {
    try {
      await createAssembly.mutateAsync({
        ...data,
        content_ids: selectedIds
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create assembly:', error);
    }
  };

  const toggleContentSelection = (contentId: string) => {
    setSelectedIds(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Create Assembly
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Create Content Assembly
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Assembly Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Product Launch Campaign"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this assembly contains and its purpose..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Select Content to Include</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose the content pieces you want to combine into this assembly
            </p>
            
            <ScrollArea className="h-64 border rounded-md p-3">
              {content && content.length > 0 ? (
                <div className="space-y-2">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
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
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No content available to add to assembly</p>
                </div>
              )}
            </ScrollArea>
            
            {selectedIds.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedIds.length} content piece{selectedIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={createAssembly.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAssembly.isPending || selectedIds.length === 0}
            >
              {createAssembly.isPending ? 'Creating...' : 'Create Assembly'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};