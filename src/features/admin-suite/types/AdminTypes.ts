// Admin Security Types
export type AdminRole = 'user' | 'admin' | 'super_admin';
export type PlanType = 'starter' | 'pro' | 'growth' | 'elite';

export enum AdminAccessLevel {
  USER_ADMIN = 'user_admin',
  TEAM_ADMIN = 'team_admin', 
  BILLING_ADMIN = 'billing_admin',
  SECURITY_ADMIN = 'security_admin',
  SUPER_ADMIN = 'super_admin'
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canUpgradeUsers: boolean;
  canManageTeams: boolean;
  canManageBilling: boolean;
  canViewAuditLogs: boolean;
  canManageSecurity: boolean;
  canAccessSystem: boolean;
  canPerformBulkActions: boolean;
  canExportData: boolean;
  canImpersonateUsers: boolean;
}

export interface AdminAccessInfo {
  hasAccess: boolean;
  role: AdminRole;
  planType: PlanType;
  accessLevel: AdminAccessLevel;
  permissions: AdminPermissions;
  requiresRecentAuth: boolean;
  sessionValid: boolean;
  planTierAccess: boolean;
}

export interface AdminSession {
  lastActivity: Date;
  isActive: boolean;
  requiresReauth: boolean;
  accessGrantedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}