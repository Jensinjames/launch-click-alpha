import { supabase } from '@/integrations/supabase/client';

export class QuotaError extends Error {
  constructor(
    message: string,
    public type: 'PLAN_LIMIT' | 'QUOTA_EXCEEDED' | 'FEATURE_DISABLED'
  ) {
    super(message);
    this.name = 'QuotaError';
  }
}

export interface FeatureUsageInfo {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetDate: string;
  canUse: boolean;
}

export class FeatureGatingService {
  /**
   * Check if user can use a feature and optionally increment usage
   */
  static async checkAndIncrementUsage(
    userId: string,
    featureName: string,
    incrementBy: number = 1,
    dryRun: boolean = false
  ): Promise<FeatureUsageInfo> {
    if (!userId || !featureName) {
      throw new Error('User ID and feature name are required');
    }

    console.log('[FeatureGatingService] Checking access for:', featureName, 'user:', userId);

    try {
      // 1. Check if feature is enabled using new hierarchy-aware function
      const { data: hasAccess, error: accessError } = await supabase.rpc('can_access_with_contract', {
        feature_name: featureName,
        check_user_id: userId,
      });

      if (accessError) {
        console.error('[FeatureGatingService] Error checking feature access:', accessError);
        throw new Error('Failed to check feature access: ' + accessError.message);
      }

      if (!hasAccess) {
        throw new QuotaError(
          `Feature '${featureName}' is not available in your current plan`,
          'PLAN_LIMIT'
        );
      }

      // 2. Get current usage and limits
      const { data: usageData, error: usageError } = await supabase.rpc('get_feature_usage_with_limits', {
        p_user_id: userId,
        p_feature_name: featureName,
      });

      if (usageError) {
        console.error('[FeatureGatingService] Error getting feature usage:', usageError);
        throw new Error('Failed to get feature usage information: ' + usageError.message);
      }

      const usage = usageData?.[0];
      if (!usage) {
        console.warn('[FeatureGatingService] No usage data found, returning default');
        // Return permissive defaults when data is missing
        return {
          used: 0,
          limit: null,
          remaining: null,
          resetDate: new Date().toISOString(),
          canUse: true,
        };
      }

      const currentUsage = usage.usage_count || 0;
      const limit = usage.feature_limit;
      const wouldExceed = limit !== null && (currentUsage + incrementBy) > limit;

      console.log('[FeatureGatingService] Usage check:', { currentUsage, limit, wouldExceed });

      // 3. Check if increment would exceed limit
      if (wouldExceed) {
        throw new QuotaError(
          `Feature quota exceeded. Usage: ${currentUsage + incrementBy}/${limit}`,
          'QUOTA_EXCEEDED'
        );
      }

      // 4. If not dry run, increment usage
      if (!dryRun && incrementBy > 0) {
        const { error: incrementError } = await supabase
          .from('feature_usage_tracking')
          .upsert(
            {
              user_id: userId,
              feature_name: featureName,
              usage_count: currentUsage + incrementBy,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              period_start: usage.period_start,
            },
            {
              onConflict: 'user_id,feature_name,period_start',
            }
          );

        if (incrementError) {
          console.error('[FeatureGatingService] Error incrementing feature usage:', incrementError);
          throw new Error('Failed to update usage tracking');
        }
      }

      const finalUsage = dryRun ? currentUsage : currentUsage + incrementBy;

      return {
        used: finalUsage,
        limit,
        remaining: limit !== null ? Math.max(0, limit - finalUsage) : null,
        resetDate: usage.period_start,
        canUse: limit === null || finalUsage < limit,
      };
    } catch (error) {
      console.error('[FeatureGatingService] Error in checkAndIncrementUsage:', error);
      
      if (error instanceof QuotaError) {
        throw error; // Re-throw quota errors
      }
      
      throw new Error('Failed to check feature usage');
    }
  }

  /**
   * Check if user can use a feature without incrementing usage
   */
  static async checkUsage(
    userId: string,
    featureName: string
  ): Promise<FeatureUsageInfo> {
    return this.checkAndIncrementUsage(userId, featureName, 0, true);
  }

  /**
   * Get usage information for multiple features at once
   */
  static async getBulkUsage(
    userId: string,
    featureNames: string[]
  ): Promise<Record<string, FeatureUsageInfo>> {
    const results: Record<string, FeatureUsageInfo> = {};

    // Use Promise.allSettled to get all results even if some fail
    const promises = featureNames.map(async (featureName) => ({
      featureName,
      result: await this.checkUsage(userId, featureName).catch((error) => ({
        error,
      })),
    }));

    const settled = await Promise.allSettled(promises);

    settled.forEach((promise) => {
      if (promise.status === 'fulfilled') {
        const { featureName, result } = promise.value;
        if ('error' in result) {
          console.error(`Error getting usage for ${featureName}:`, result.error);
        } else {
          results[featureName] = result;
        }
      }
    });

    return results;
  }

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
}