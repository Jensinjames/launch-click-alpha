// Permission Matrix and Access Control Types
import type { AdminRole, PlanType } from './AdminTypes';
import { AdminAccessLevel } from './AdminTypes';

export interface PermissionRule {
  requiredRole: AdminRole;
  requiredPlan?: PlanType[];
  requiresRecentAuth?: boolean;
  allowedAccessLevels: AdminAccessLevel[];
}

export interface FeaturePermissions {
  [key: string]: PermissionRule;
}

// Define permission matrix for admin features
export const ADMIN_FEATURE_PERMISSIONS: FeaturePermissions = {
  // User Management
  'admin.users.view': {
    requiredRole: 'admin',
    requiredPlan: ['pro', 'growth', 'elite'],
    allowedAccessLevels: [AdminAccessLevel.USER_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.users.edit': {
    requiredRole: 'admin',
    requiredPlan: ['growth', 'elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.USER_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.users.upgrade': {
    requiredRole: 'admin',
    requiredPlan: ['growth', 'elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.USER_ADMIN, AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.users.bulk': {
    requiredRole: 'admin',
    requiredPlan: ['elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.SUPER_ADMIN]
  },

  // Team Management
  'admin.teams.view': {
    requiredRole: 'admin',
    requiredPlan: ['pro', 'growth', 'elite'],
    allowedAccessLevels: [AdminAccessLevel.TEAM_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.teams.edit': {
    requiredRole: 'admin',
    requiredPlan: ['growth', 'elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.TEAM_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.teams.delete': {
    requiredRole: 'super_admin',
    requiredPlan: ['elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.SUPER_ADMIN]
  },

  // Billing Management
  'admin.billing.view': {
    requiredRole: 'admin',
    requiredPlan: ['pro', 'growth', 'elite'],
    allowedAccessLevels: [AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.billing.credits': {
    requiredRole: 'admin',
    requiredPlan: ['growth', 'elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.BILLING_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },

  // Security & Audit
  'admin.security.audit': {
    requiredRole: 'admin',
    requiredPlan: ['pro', 'growth', 'elite'],
    allowedAccessLevels: [AdminAccessLevel.SECURITY_ADMIN, AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.security.settings': {
    requiredRole: 'super_admin',
    requiredPlan: ['elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.SUPER_ADMIN]
  },

  // System Access
  'admin.system.monitoring': {
    requiredRole: 'super_admin',
    requiredPlan: ['elite'],
    allowedAccessLevels: [AdminAccessLevel.SUPER_ADMIN]
  },
  'admin.system.config': {
    requiredRole: 'super_admin',
    requiredPlan: ['elite'],
    requiresRecentAuth: true,
    allowedAccessLevels: [AdminAccessLevel.SUPER_ADMIN]
  }
};

export type AdminFeature = keyof typeof ADMIN_FEATURE_PERMISSIONS;