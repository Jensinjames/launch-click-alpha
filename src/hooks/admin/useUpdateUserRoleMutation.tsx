
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

type UserRole = 'admin' | 'user' | 'super_admin';

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { userId: string; newRole: UserRole }) => {
      return addToQueue('admin', async () => {
        // First validate admin session freshness for sensitive role operations
        const { data: sessionValid, error: sessionError } = await supabase.rpc('require_fresh_admin_session', {
          max_age_minutes: 30
        });

        if (sessionError || !sessionValid) {
          throw new Error('Fresh admin authentication required for role changes');
        }

        // Update user role
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: data.newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.userId);

        if (error) throw error;

        // Invalidate all sessions for the user whose role changed (security measure)
        await supabase.rpc('invalidate_user_sessions', {
          target_user_id: data.userId,
          reason: 'role_change'
        });

        return data;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });
};
