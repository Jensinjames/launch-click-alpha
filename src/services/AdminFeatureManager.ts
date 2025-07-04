// Admin Feature Manager - Focused on admin-specific feature management
import { supabase } from '@/integrations/supabase/client';

export class AdminFeatureManager {
  /**
   * Reset usage for a specific feature (admin only)
   */
  static async resetFeatureUsage(
    userId: string,
    featureName: string,
    adminUserId: string
  ): Promise<void> {
    // Check if the admin user is actually an admin
    const { data: isAdmin } = await supabase.rpc('is_admin_or_super', {
      user_id: adminUserId,
    });

    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { error } = await supabase
      .from('feature_usage_tracking')
      .update({
        usage_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('feature_name', featureName)
      .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (error) {
      console.error('Error resetting feature usage:', error);
      throw new Error('Failed to reset feature usage');
    }
  }

  /**
   * Reset all usage for a user (admin only)
   */
  static async resetAllUserUsage(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    // Check if the admin user is actually an admin
    const { data: isAdmin } = await supabase.rpc('is_admin_or_super', {
      user_id: adminUserId,
    });

    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { error } = await supabase
      .from('feature_usage_tracking')
      .update({
        usage_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (error) {
      console.error('Error resetting all user usage:', error);
      throw new Error('Failed to reset all user usage');
    }
  }

  /**
   * Get usage statistics for all users (admin only)
   */
  static async getUserUsageStats(adminUserId: string): Promise<any[]> {
    // Check if the admin user is actually an admin
    const { data: isAdmin } = await supabase.rpc('is_admin_or_super', {
      user_id: adminUserId,
    });

    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { data, error } = await supabase
      .from('feature_usage_tracking')
      .select(`
        user_id,
        feature_name,
        usage_count,
        last_used_at,
        profiles!inner(email, full_name)
      `)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error getting user usage stats:', error);
      throw new Error('Failed to get user usage statistics');
    }

    return data || [];
  }
}