
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTransferOwnership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { teamId: string; newOwnerId: string }) => {
      const { data: result, error } = await supabase
        .from('teams')
        .update({ owner_id: data.newOwnerId })
        .eq('id', data.teamId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
      toast.success('Team ownership transferred successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to transfer ownership');
    }
  });
};
