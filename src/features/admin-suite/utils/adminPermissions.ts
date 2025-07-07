// Admin Permission Utilities
import type { 
  AdminRole, 
  PlanType, 
  AdminPermissions, 
  AdminAccessInfo 
} from '../types/AdminTypes';
import { AdminAccessLevel } from '../types/AdminTypes';
import type { AdminFeature, PermissionRule } from '../types/PermissionTypes';
import { ADMIN_FEATURE_PERMISSIONS } from '../types/PermissionTypes';

/**
 * Determine admin access level based on role and plan
 */
export const getAdminAccessLevel = (role: AdminRole, planType: PlanType): AdminAccessLevel => {
  if (role === 'super_admin') {
    return AdminAccessLevel.SUPER_ADMIN;
  }
  
  if (role === 'admin') {
    // Assign access level based on plan tier for admin users
    switch (planType) {
      case 'elite':
        return AdminAccessLevel.BILLING_ADMIN; // Full access except super admin
      case 'growth':
        return AdminAccessLevel.TEAM_ADMIN;
      case 'pro':
        return AdminAccessLevel.USER_ADMIN;
      default:
        return AdminAccessLevel.USER_ADMIN;
    }
  }
  
  // Non-admin users get no admin access
  throw new Error('User does not have admin privileges');
};

/**
 * Generate permissions matrix based on role, plan, and access level
 */
export const getAdminPermissions = (
  role: AdminRole, 
  planType: PlanType, 
  accessLevel: AdminAccessLevel
): AdminPermissions => {
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isElitePlan = planType === 'elite';
  const isGrowthPlusePlan = ['growth', 'elite'].includes(planType);
  const isProPlusePlan = ['pro', 'growth', 'elite'].includes(planType);

  return {
    // User Management
    canManageUsers: isAdmin && isProPlusePlan && 
      [AdminAccessLevel.USER_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    canUpgradeUsers: isAdmin && isGrowthPlusePlan && 
      [AdminAccessLevel.USER_ADMIN, AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    
    // Team Management  
    canManageTeams: isAdmin && isProPlusePlan && 
      [AdminAccessLevel.TEAM_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    
    // Billing Management
    canManageBilling: isAdmin && isProPlusePlan && 
      [AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    
    // Security & Audit
    canViewAuditLogs: isAdmin && isProPlusePlan && 
      [AdminAccessLevel.SECURITY_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    canManageSecurity: isSuperAdmin && isElitePlan,
    
    // System Access
    canAccessSystem: isSuperAdmin && isElitePlan,
    
    // Advanced Operations
    canPerformBulkActions: isSuperAdmin && isElitePlan,
    canExportData: isAdmin && isGrowthPlusePlan && 
      [AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN].includes(accessLevel),
    canImpersonateUsers: isSuperAdmin && isElitePlan
  };
};

/**
 * Check if user has permission for specific admin feature
 */
export const hasAdminFeatureAccess = (
  feature: AdminFeature,
  adminInfo: AdminAccessInfo,
  recentlyAuthenticated: boolean = false
): boolean => {
  const rule = ADMIN_FEATURE_PERMISSIONS[feature];
  if (!rule) return false;

  // Check role requirement
  if (!checkRoleRequirement(adminInfo.role, rule.requiredRole)) {
    return false;
  }

  // Check plan requirement
  if (rule.requiredPlan && !rule.requiredPlan.includes(adminInfo.planType)) {
    return false;
  }

  // Check access level requirement
  if (!rule.allowedAccessLevels.includes(adminInfo.accessLevel)) {
    return false;
  }

  // Check recent authentication requirement
  if (rule.requiresRecentAuth && !recentlyAuthenticated) {
    return false;
  }

  return true;
};

/**
 * Check if user's role meets the minimum requirement
 */
const checkRoleRequirement = (userRole: AdminRole, requiredRole: AdminRole): boolean => {
  const roleHierarchy: Record<AdminRole, number> = {
    'user': 0,
    'admin': 1,
    'super_admin': 2
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Validate plan tier access for admin features
 */
export const validatePlanTierAccess = (planType: PlanType, requiredTier: PlanType[]): boolean => {
  return requiredTier.includes(planType);
};

/**
 * Get minimum plan required for admin access
 */
export const getMinimumAdminPlan = (role: AdminRole): PlanType => {
  if (role === 'super_admin') return 'pro'; // Super admins need at least Pro
  if (role === 'admin') return 'pro'; // Regular admins need at least Pro
  throw new Error('User role does not support admin access');
};

/**
 * Check if user meets minimum requirements for any admin access
 */
export const hasMinimumAdminRequirements = (role: AdminRole, planType: PlanType): boolean => {
  try {
    const minPlan = getMinimumAdminPlan(role);
    const planHierarchy: Record<PlanType, number> = {
      'starter': 0,
      'pro': 1,
      'growth': 2,
      'elite': 3
    };

    return planHierarchy[planType] >= planHierarchy[minPlan];
  } catch {
    return false;
  }
};