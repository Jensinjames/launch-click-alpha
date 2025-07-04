
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteContentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
      return contentId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['user-content'], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((item: any) => item.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ['user-content'] });
      toast.success('Content deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete content');
    }
  });
};
