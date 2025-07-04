// Lazy-loaded admin components for better code splitting
import { lazy } from 'react';

// Lazy load admin components to reduce initial bundle size
export const LazyTeamsManagement = lazy(() => 
  import('@/features/admin/components/TeamsManagement').then(module => ({ 
    default: module.TeamsManagement 
  }))
);

export const LazyCreditsManagement = lazy(() => 
  import('@/features/admin/components/CreditsManagement').then(module => ({ 
    default: module.CreditsManagement 
  }))
);

export const LazyAuditLogs = lazy(() => 
  import('@/features/admin/components/AuditLogs').then(module => ({ 
    default: module.AuditLogs 
  }))
);

// Loading fallback component for admin sections
export const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);