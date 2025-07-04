
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('teams')
        .update({
          name: data.name,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['user-teams'], (oldData: any) => {
        if (!oldData) return [result];
        return oldData.map((team: any) => 
          team.id === result.id ? result : team
        );
      });
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update team');
    }
  });
};
