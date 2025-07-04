
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInviteMembersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { teamId: string; emails: string[]; role: string }) => {
      const { data: result, error } = await supabase.functions.invoke('invite-team-members', {
        body: {
          team_id: data.teamId,
          emails: data.emails,
          role: data.role
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
      toast.success('Team invitations sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invitations');
    }
  });
};
