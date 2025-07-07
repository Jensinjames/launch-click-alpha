import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Edit } from 'lucide-react';
import { useUpdateAssembly } from '@/hooks/useContentAssembly';
import type { ContentAssembly, UpdateAssemblyRequest } from '@/types/assembly';

interface EditAssemblyDialogProps {
  assembly: ContentAssembly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditAssemblyDialog = ({ assembly, open, onOpenChange }: EditAssemblyDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UpdateAssemblyRequest>();
  const updateAssembly = useUpdateAssembly();
  
  const status = watch('status');

  useEffect(() => {
    if (assembly && open) {
      reset({
        title: assembly.title,
        description: assembly.description || '',
        status: assembly.status
      });
      setValue('status', assembly.status);
    }
  }, [assembly, open, reset, setValue]);

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = async (data: UpdateAssemblyRequest) => {
    if (!assembly) return;
    
    try {
      await updateAssembly.mutateAsync({
        id: assembly.id,
        ...data
      });
      handleClose();
    } catch (error) {
      console.error('Failed to update assembly:', error);
    }
  };

  if (!assembly) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Assembly
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
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
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setValue('status', value as 'draft' | 'published' | 'archived')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={updateAssembly.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateAssembly.isPending}
            >
              {updateAssembly.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};