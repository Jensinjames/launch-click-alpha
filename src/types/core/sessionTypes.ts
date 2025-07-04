// Unified Session Types - Single Source of Truth
export interface SessionInfo {
  id: string;
  user_id: string;
  session_id: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  user_agent?: string | null;
  ip_address?: string | null | unknown;
  invalidated_at?: string | null;
  invalidation_reason?: string | null;
}

export interface SessionConfig {
  maxAge?: number;
  requireRecentAuth?: boolean;
  requireFreshSession?: boolean;
}

export interface SessionState {
  sessions: SessionInfo[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: string | null;
}