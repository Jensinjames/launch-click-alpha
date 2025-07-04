// Admin feature barrel exports
export { default as AdminPage } from '@/pages/Admin';

// Admin hooks
export { useAdminMutations, type UserRole } from './hooks/useAdminMutations';

// Admin components
export { AdminSecurityWrapper } from './components/AdminSecurityWrapper';
// EmergencyAdminWrapper merged into AdminSecurityWrapper
export { OptimizedCreditsManagement } from './components/OptimizedCreditsManagement';
export { AuditLogs } from './components/AuditLogs';
export { TeamsManagement } from './components/TeamsManagement';
export { CreditsManagement } from './components/CreditsManagement';