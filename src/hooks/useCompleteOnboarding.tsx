import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('id', user.id);

      if (error) throw error;

      // Log the onboarding completion
      await supabase.rpc('log_security_event', {
        event_type: 'user_onboarding_completed',
        event_data: { user_id: user.id, completed_at: new Date().toISOString() }
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Welcome to LaunchClick! Your account is now fully set up.');
    },
    onError: (error: any) => {
      console.error('Onboarding completion error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  });
};