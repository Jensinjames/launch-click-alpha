import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'user' | 'super_admin';

export const useAdminMutations = () => {
  const queryClient = useQueryClient();

  // Update User Credits Mutation
  const updateUserCredits = useMutation({
    mutationFn: async (data: { userId: string; newMonthlyLimit: number }) => {
      const { error } = await supabase
        .from('user_credits')
        .update({ monthly_limit: data.newMonthlyLimit })
        .eq('user_id', data.userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_update_credit_limit',
        p_table_name: 'user_credits',
        p_record_id: data.userId,
        p_new_values: { 
          monthly_limit: data.newMonthlyLimit, 
          updated_at: new Date().toISOString() 
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
      toast.success('Credit limit updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update credit limit');
    }
  });

  // Reset User Credits Mutation
  const resetUserCredits = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('reset-user-credits', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
      toast.success(data?.message || 'Credits reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset credits');
    }
  });

  // Delete Team Mutation
  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_delete_team',
        p_table_name: 'teams',
        p_record_id: teamId,
        p_new_values: { deleted_at: new Date().toISOString() }
      });

      return teamId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete team');
    }
  });

  // Ban User Mutation
  const banUser = useMutation({
    mutationFn: async (data: { userId: string; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'user' as UserRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.userId);

      if (error) throw error;

      // Log the admin action with ban information
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_ban_user',
        p_table_name: 'profiles',
        p_record_id: data.userId,
        p_new_values: { 
          status: 'banned',
          ban_reason: data.reason,
          banned_at: new Date().toISOString()
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User banned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to ban user');
    }
  });

  // Unban User Mutation
  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'user' as UserRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_unban_user',
        p_table_name: 'profiles',
        p_record_id: userId,
        p_new_values: { 
          status: 'active',
          unbanned_at: new Date().toISOString()
        }
      });

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User unbanned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unban user');
    }
  });

  // Update User Role Mutation
  const updateUserRole = useMutation({
    mutationFn: async (data: { userId: string; newRole: UserRole }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });

  // Update User Plan Mutation
  const updateUserPlan = useMutation({
    mutationFn: async (data: { userId: string; newPlan: 'starter' | 'pro' | 'growth' | 'elite' }) => {
      const { error } = await supabase
        .from('user_plans')
        .update({ 
          plan_type: data.newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_update_user_plan',
        p_table_name: 'user_plans',
        p_record_id: data.userId,
        p_new_values: { 
          plan_type: data.newPlan,
          updated_at: new Date().toISOString()
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User plan updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user plan');
    }
  });

  return {
    updateUserCredits,
    resetUserCredits,
    deleteTeam,
    banUser,
    unbanUser,
    updateUserRole,
    updateUserPlan,
    
    // Consolidated state
    isLoading: updateUserCredits.isPending || 
               resetUserCredits.isPending || 
               deleteTeam.isPending || 
               banUser.isPending || 
               unbanUser.isPending || 
               updateUserRole.isPending ||
               updateUserPlan.isPending,
    
    // Reset all mutations
    reset: () => {
      updateUserCredits.reset();
      resetUserCredits.reset();
      deleteTeam.reset();
      banUser.reset();
      unbanUser.reset();
      updateUserRole.reset();
      updateUserPlan.reset();
    }
  };
};