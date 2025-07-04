// Centralized query keys for better cache management and invalidation
export const queryKeys = {
  // User-related queries
  user: {
    profile: ['user', 'profile'] as const,
    plans: ['user', 'plans'] as const,
    credits: ['user', 'credits'] as const,
    preferences: ['user', 'preferences'] as const,
  },
  
  // Content-related queries  
  content: {
    all: ['content'] as const,
    list: (filters: Record<string, any> = {}) => ['content', 'list', filters] as const,
    detail: (id: string) => ['content', 'detail', id] as const,
    recent: ['content', 'recent'] as const,
    analytics: (id: string) => ['content', 'analytics', id] as const,
  },
  
  // Team-related queries
  teams: {
    all: ['teams'] as const,
    list: ['teams', 'list'] as const,
    detail: (id: string) => ['teams', 'detail', id] as const,
    members: (id: string) => ['teams', 'members', id] as const,
    analytics: (id: string) => ['teams', 'analytics', id] as const,
    invitations: (id: string) => ['teams', 'invitations', id] as const,
  },
  
  // Analytics queries
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    metrics: (timeRange: string = '30d') => ['analytics', 'metrics', timeRange] as const,
    performance: (contentType?: string) => ['analytics', 'performance', contentType] as const,
  },
  
  // Admin queries (with longer stale times)
  admin: {
    users: ['admin', 'users'] as const,
    teams: ['admin', 'teams'] as const,
    credits: ['admin', 'credits'] as const,
    auditLogs: (filters: Record<string, any> = {}) => ['admin', 'audit-logs', filters] as const,
  },
  
  // Templates queries
  templates: {
    all: ['templates'] as const,
    list: (filters: Record<string, any> = {}) => ['templates', 'list', filters] as const,
    detail: (id: string) => ['templates', 'detail', id] as const,
    featured: ['templates', 'featured'] as const,
  },
  
  // Integrations queries
  integrations: {
    all: ['integrations'] as const,
    active: ['integrations', 'active'] as const,
    detail: (provider: string) => ['integrations', 'detail', provider] as const,
  },
} as const;

// Query invalidation utilities
export const invalidateQueries = {
  user: () => queryKeys.user,
  content: () => queryKeys.content.all,
  teams: () => queryKeys.teams.all,
  analytics: () => queryKeys.analytics,
  admin: () => queryKeys.admin,
} as const;