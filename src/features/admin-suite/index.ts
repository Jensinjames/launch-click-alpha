// Admin Suite Feature Exports

// Layout Components
export { AdminLayout } from './components/layout/AdminLayout';
export { AdminSidebar } from './components/layout/AdminSidebar';
export { AdminHeader } from './components/layout/AdminHeader';
export { AdminBreadcrumb } from './components/layout/AdminBreadcrumb';

// Dashboard Components
export { AdminDashboard } from './components/dashboard/AdminDashboard';
export { AdminStats } from './components/dashboard/AdminStats';
export { QuickActions } from './components/dashboard/QuickActions';

// Section Components
export { UserManagement } from './components/users/UserManagement';
export { TeamAdministration } from './components/teams/TeamAdministration';
export { BillingManagement } from './components/billing/BillingManagement';
export { SecurityManagement } from './components/security/SecurityManagement';
export { SystemManagement } from './components/system/SystemManagement';

// Security Components
export { default as AdminRouteGuard } from './components/AdminRouteGuard';
export { default as AdminAccessIndicator } from './components/AdminAccessIndicator';

// Hooks
export { useEnhancedAdminAccess, useAdminFeatureAccess } from './hooks/useEnhancedAdminAccess';
export { useAdminSecurityMiddleware, useAdminRateLimit } from './hooks/useAdminSecurityMiddleware';

// Types
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

// Utilities
export { 
  getAdminAccessLevel,
  getAdminPermissions,
  hasAdminFeatureAccess,
  validatePlanTierAccess,
  hasMinimumAdminRequirements
} from './utils/adminPermissions';

export { ADMIN_FEATURE_PERMISSIONS } from './types/PermissionTypes';