// Admin Suite Feature Exports
export { default as AdminRouteGuard } from './components/AdminRouteGuard';
export { default as AdminAccessIndicator } from './components/AdminAccessIndicator';

export { useEnhancedAdminAccess, useAdminFeatureAccess } from './hooks/useEnhancedAdminAccess';
export { useAdminSecurityMiddleware, useAdminRateLimit } from './hooks/useAdminSecurityMiddleware';

export type {
  AdminRole,
  PlanType,
  AdminAccessLevel,
  AdminPermissions,
  AdminAccessInfo,
  AdminSession
} from './types/AdminTypes';

export type {
  PermissionRule,
  FeaturePermissions,
  AdminFeature
} from './types/PermissionTypes';

export { 
  getAdminAccessLevel,
  getAdminPermissions,
  hasAdminFeatureAccess,
  validatePlanTierAccess,
  hasMinimumAdminRequirements
} from './utils/adminPermissions';

export { ADMIN_FEATURE_PERMISSIONS } from './types/PermissionTypes';