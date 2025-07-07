// Enhanced Admin Access Hook with Composite Security
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserPlan } from '@/hooks/useUserPlan';
import { supabase } from '@/integrations/supabase/client';
import { 
  getAdminAccessLevel, 
  getAdminPermissions, 
  hasAdminFeatureAccess,
  hasMinimumAdminRequirements 
} from '../utils/adminPermissions';
import { validateAdminAccessEnhanced } from '@/security/auth';
import type { AdminRole, PlanType, AdminAccessInfo, AdminSession } from '../types/AdminTypes';
import type { AdminFeature } from '../types/PermissionTypes';

const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const RECENT_AUTH_THRESHOLD = 30 * 60 * 1000; // 30 minutes

export const useEnhancedAdminAccess = () => {
  const { user } = useAuth();
  const { plan } = useUserPlan();
  const queryClient = useQueryClient();

  // Query for admin access validation
  const adminAccessQuery = useQuery({
    queryKey: ['enhanced-admin-access', user?.id],
    queryFn: async (): Promise<AdminAccessInfo> => {
      if (!user || !plan) {
        throw new Error('User not authenticated or plan not loaded');
      }

      // Get user role from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      const role = (profile?.role as AdminRole) || 'user';
      const planType = plan.planType as PlanType;

      // Check minimum requirements
      if (!hasMinimumAdminRequirements(role, planType)) {
        return {
          hasAccess: false,
          role,
          planType,
          accessLevel: getAdminAccessLevel('user', 'starter'),
          permissions: getAdminPermissions('user', 'starter', getAdminAccessLevel('user', 'starter')),
          requiresRecentAuth: false,
          sessionValid: false,
          planTierAccess: false
        };
      }

      // Validate admin session
      const sessionValid = await validateAdminAccessEnhanced(false);
      if (!sessionValid) {
        throw new Error('Admin session validation failed');
      }

      // Determine access level and permissions
      const accessLevel = getAdminAccessLevel(role, planType);
      const permissions = getAdminPermissions(role, planType, accessLevel);

      return {
        hasAccess: true,
        role,
        planType,
        accessLevel,
        permissions,
        requiresRecentAuth: false,
        sessionValid: true,
        planTierAccess: true
      };
    },
    enabled: !!user && !!plan,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Re-validate every 10 minutes
    retry: (failureCount, error) => {
      // Don't retry authentication failures
      if (error?.message?.includes('validation failed')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Query for admin session status
  const sessionQuery = useQuery({
    queryKey: ['admin-session', user?.id],
    queryFn: async (): Promise<AdminSession> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check recent authentication
      const { data: session } = await supabase.auth.getSession();
      const lastSignIn = session.session?.user.last_sign_in_at;
      const isRecentAuth = lastSignIn ? 
        (Date.now() - new Date(lastSignIn).getTime()) < RECENT_AUTH_THRESHOLD : false;

      return {
        lastActivity: new Date(),
        isActive: true,
        requiresReauth: !isRecentAuth,
        accessGrantedAt: new Date(),
        ipAddress: undefined, // Would be populated by server-side logic
        userAgent: navigator.userAgent
      };
    },
    enabled: !!user && adminAccessQuery.data?.hasAccess,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000 // Check session every 5 minutes
  });

  // Helper functions
  const hasFeatureAccess = (feature: AdminFeature): boolean => {
    if (!adminAccessQuery.data?.hasAccess) return false;
    
    const recentlyAuthenticated = sessionQuery.data ? 
      !sessionQuery.data.requiresReauth : false;
    
    return hasAdminFeatureAccess(
      feature, 
      adminAccessQuery.data, 
      recentlyAuthenticated
    );
  };

  const requireRecentAuth = async (): Promise<boolean> => {
    const isValid = await validateAdminAccessEnhanced(true);
    if (isValid) {
      // Refresh session data
      queryClient.invalidateQueries({ queryKey: ['admin-session'] });
    }
    return isValid;
  };

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: ['enhanced-admin-access'] });
    queryClient.invalidateQueries({ queryKey: ['admin-session'] });
  };

  return {
    // Access information
    hasAccess: adminAccessQuery.data?.hasAccess || false,
    accessLevel: adminAccessQuery.data?.accessLevel,
    permissions: adminAccessQuery.data?.permissions,
    role: adminAccessQuery.data?.role,
    planType: adminAccessQuery.data?.planType,
    
    // Session information
    session: sessionQuery.data,
    sessionValid: adminAccessQuery.data?.sessionValid || false,
    requiresRecentAuth: sessionQuery.data?.requiresReauth || false,
    
    // Loading states
    isLoading: adminAccessQuery.isLoading || sessionQuery.isLoading,
    isError: adminAccessQuery.isError || sessionQuery.isError,
    error: adminAccessQuery.error || sessionQuery.error,
    
    // Helper functions
    hasFeatureAccess,
    requireRecentAuth,
    invalidateSession,
    
    // Query controls
    refetch: () => {
      adminAccessQuery.refetch();
      sessionQuery.refetch();
    }
  };
};

// Convenience hook for specific feature access
export const useAdminFeatureAccess = (feature: AdminFeature) => {
  const { hasFeatureAccess, isLoading, hasAccess } = useEnhancedAdminAccess();
  
  return {
    canAccess: hasAccess && hasFeatureAccess(feature),
    isLoading,
    hasBaseAccess: hasAccess
  };
};