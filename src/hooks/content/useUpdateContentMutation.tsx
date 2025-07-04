
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUpdateContentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      content?: any;
      is_favorite?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('generated_content')
        .update({
          title: data.title,
          content: data.content,
          is_favorite: data.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['user-content'], (oldData: any) => {
        if (!oldData) return [result];
        return oldData.map((item: any) => 
          item.id === result.id ? result : item
        );
      });
      toast.success('Content updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update content');
    }
  });
};
