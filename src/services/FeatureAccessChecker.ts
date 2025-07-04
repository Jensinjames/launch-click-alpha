// Feature Access Checker - Focused on checking feature access
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

export interface FeatureAccessInfo {
  hasAccess: boolean;
  reason?: string;
  planRequired?: string;
}

export class FeatureAccessChecker {
  /**
   * Check if user has access to a specific feature
   */
  static async checkAccess(
    userId: string,
    featureName: string
  ): Promise<FeatureAccessInfo> {
    if (!userId || !featureName) {
      return {
        hasAccess: false,
        reason: 'User ID and feature name are required'
      };
    }

    console.log('[FeatureAccessChecker] Checking access for:', featureName, 'user:', userId);

    try {
      const { data: hasAccess, error: accessError } = await supabase.rpc('can_access_with_contract', {
        feature_name: featureName,
        check_user_id: userId,
      });

      if (accessError) {
        console.error('[FeatureAccessChecker] Error checking feature access:', accessError);
        return {
          hasAccess: false,
          reason: 'Failed to check feature access: ' + accessError.message
        };
      }

      return {
        hasAccess: hasAccess || false,
        reason: hasAccess ? undefined : `Feature '${featureName}' is not available in your current plan`
      };
    } catch (error) {
      console.error('[FeatureAccessChecker] Error in checkAccess:', error);
      return {
        hasAccess: false,
        reason: 'Failed to check feature access'
      };
    }
  }

  /**
   * Check access to multiple features at once
   */
  static async checkBulkAccess(
    userId: string,
    featureNames: string[]
  ): Promise<Record<string, FeatureAccessInfo>> {
    const results: Record<string, FeatureAccessInfo> = {};

    if (!userId || !featureNames.length) {
      return results;
    }

    try {
      const { data, error } = await supabase.rpc('bulk_feature_access_check', {
        feature_names: featureNames,
        check_user_id: userId
      });

      if (error) {
        console.error('[FeatureAccessChecker] Bulk access check error:', error);
        // Fallback to individual checks
        return await this.checkBulkAccessFallback(userId, featureNames);
      }

      // Convert boolean results to FeatureAccessInfo
      for (const [featureName, hasAccess] of Object.entries(data as Record<string, boolean>)) {
        results[featureName] = {
          hasAccess,
          reason: hasAccess ? undefined : `Feature '${featureName}' is not available in your current plan`
        };
      }

      return results;
    } catch (error) {
      console.error('[FeatureAccessChecker] Error in checkBulkAccess:', error);
      return await this.checkBulkAccessFallback(userId, featureNames);
    }
  }

  /**
   * Fallback method for bulk access checks
   */
  private static async checkBulkAccessFallback(
    userId: string,
    featureNames: string[]
  ): Promise<Record<string, FeatureAccessInfo>> {
    console.warn('[FeatureAccessChecker] Using fallback individual checks');
    const results: Record<string, FeatureAccessInfo> = {};
    
    const batchSize = 3;
    for (let i = 0; i < featureNames.length; i += batchSize) {
      const batch = featureNames.slice(i, i + batchSize);
      const promises = batch.map(featureName => this.checkAccess(userId, featureName));
      
      const batchResults = await Promise.allSettled(promises);
      batchResults.forEach((result, index) => {
        const featureName = batch[index];
        if (result.status === 'fulfilled') {
          results[featureName] = result.value;
        } else {
          results[featureName] = {
            hasAccess: false,
            reason: 'Failed to check feature access'
          };
        }
      });
    }

    return results;
  }
}