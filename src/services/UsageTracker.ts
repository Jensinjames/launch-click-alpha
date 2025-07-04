// Usage Tracker - Focused on tracking and managing feature usage
import { supabase } from '@/integrations/supabase/client';
import { QuotaError } from './FeatureAccessChecker';

export interface FeatureUsageInfo {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetDate: string;
  canUse: boolean;
}

export class UsageTracker {
  /**
   * Get current usage for a feature
   */
  static async getUsage(
    userId: string,
    featureName: string
  ): Promise<FeatureUsageInfo> {
    if (!userId || !featureName) {
      throw new Error('User ID and feature name are required');
    }

    try {
      const { data: usageData, error: usageError } = await supabase.rpc('get_feature_usage_with_limits', {
        p_user_id: userId,
        p_feature_name: featureName,
      });

      if (usageError) {
        console.error('[UsageTracker] Error getting feature usage:', usageError);
        throw new Error('Failed to get feature usage information: ' + usageError.message);
      }

      const usage = usageData?.[0];
      if (!usage) {
        console.warn('[UsageTracker] No usage data found, returning default');
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

      return {
        used: currentUsage,
        limit,
        remaining: limit !== null ? Math.max(0, limit - currentUsage) : null,
        resetDate: usage.period_start,
        canUse: limit === null || currentUsage < limit,
      };
    } catch (error) {
      console.error('[UsageTracker] Error in getUsage:', error);
      throw new Error('Failed to get feature usage');
    }
  }

  /**
   * Increment usage for a feature
   */
  static async incrementUsage(
    userId: string,
    featureName: string,
    incrementBy: number = 1
  ): Promise<FeatureUsageInfo> {
    if (!userId || !featureName) {
      throw new Error('User ID and feature name are required');
    }

    console.log('[UsageTracker] Incrementing usage for:', featureName, 'user:', userId, 'by:', incrementBy);

    try {
      // Get current usage first
      const currentUsage = await this.getUsage(userId, featureName);
      
      // Check if increment would exceed limit
      if (currentUsage.limit !== null && (currentUsage.used + incrementBy) > currentUsage.limit) {
        throw new QuotaError(
          `Feature quota exceeded. Usage: ${currentUsage.used + incrementBy}/${currentUsage.limit}`,
          'QUOTA_EXCEEDED'
        );
      }

      // Increment usage
      const { error: incrementError } = await supabase
        .from('feature_usage_tracking')
        .upsert(
          {
            user_id: userId,
            feature_name: featureName,
            usage_count: currentUsage.used + incrementBy,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            period_start: currentUsage.resetDate,
          },
          {
            onConflict: 'user_id,feature_name,period_start',
          }
        );

      if (incrementError) {
        console.error('[UsageTracker] Error incrementing feature usage:', incrementError);
        throw new Error('Failed to update usage tracking');
      }

      // Return updated usage info
      return {
        used: currentUsage.used + incrementBy,
        limit: currentUsage.limit,
        remaining: currentUsage.limit !== null ? Math.max(0, currentUsage.limit - (currentUsage.used + incrementBy)) : null,
        resetDate: currentUsage.resetDate,
        canUse: currentUsage.limit === null || (currentUsage.used + incrementBy) < currentUsage.limit,
      };
    } catch (error) {
      console.error('[UsageTracker] Error in incrementUsage:', error);
      
      if (error instanceof QuotaError) {
        throw error;
      }
      
      throw new Error('Failed to increment feature usage');
    }
  }

  /**
   * Get usage information for multiple features at once
   */
  static async getBulkUsage(
    userId: string,
    featureNames: string[]
  ): Promise<Record<string, FeatureUsageInfo>> {
    const results: Record<string, FeatureUsageInfo> = {};

    const promises = featureNames.map(async (featureName) => ({
      featureName,
      result: await this.getUsage(userId, featureName).catch((error) => ({
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
}