// Admin feature barrel exports
export { default as AdminPage } from '@/pages/Admin';

// Admin hooks
export { useAdminMutations, type UserRole } from './hooks/useAdminMutations';

// Admin components
export { AdminSecurityWrapper } from '@/components/admin/AdminSecurityWrapper';
export { EmergencyAdminWrapper } from '@/components/admin/EmergencyAdminWrapper';
export { OptimizedCreditsManagement } from '@/components/admin/OptimizedCreditsManagement';
export { AuditLogs } from '@/components/admin/AuditLogs';
export { TeamsManagement } from '@/components/admin/TeamsManagement';
export { CreditsManagement } from '@/components/admin/CreditsManagement';