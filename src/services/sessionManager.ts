// Enhanced Session Management Service
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/securityLogger';

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
}

class SessionManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Initialize session tracking
  async initializeSession(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create or update session record
      await supabase.from('user_sessions').upsert({
        user_id: user.id,
        session_id: sessionId,
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString(),
        user_agent: navigator.userAgent
      });

      // Start session monitoring
      this.startSessionMonitoring();

      await logSecurityEvent('session_initialized', {
        sessionId,
        userId: user.id,
        userAgent: navigator.userAgent
      });

    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  // Update session activity
  async updateActivity(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // Check for session timeout
  async checkSessionTimeout(sessionId: string): Promise<boolean> {
    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (!session) return true; // Session not found, consider expired

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      
      if (now > expiresAt) {
        await this.expireSession(sessionId);
        return true; // Session expired
      }

      return false; // Session still active
    } catch (error) {
      console.error('Failed to check session timeout:', error);
      return true; // On error, consider expired for security
    }
  }

  // Expire a session
  async expireSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      await logSecurityEvent('session_expired', { sessionId });
    } catch (error) {
      console.error('Failed to expire session:', error);
    }
  }

  // Get active sessions for a user
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return sessions || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  // Terminate all other sessions (useful for "sign out everywhere")
  async terminateOtherSessions(currentSessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('session_id', currentSessionId);

      await logSecurityEvent('other_sessions_terminated', {
        userId: user.id,
        currentSessionId
      });
    } catch (error) {
      console.error('Failed to terminate other sessions:', error);
    }
  }

  // Start session monitoring
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) return; // Already monitoring

    this.sessionCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.updateActivity(session.access_token);
        
        // Check if session has expired
        const isExpired = await this.checkSessionTimeout(session.access_token);
        if (isExpired) {
          await supabase.auth.signOut();
        }
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  // Stop session monitoring
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Cleanup expired sessions (call periodically)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  // Detect suspicious activity
  async detectSuspiciousActivity(sessionId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get recent sessions for this user
      const sessions = await this.getUserSessions(user.id);
      
      // Check for multiple concurrent sessions from different locations
      const activeSessions = sessions.filter(s => s.is_active);
      if (activeSessions.length > 3) {
        await logSecurityEvent('suspicious_multiple_sessions', {
          userId: user.id,
          sessionCount: activeSessions.length,
          sessionId
        });
        return true;
      }

      // Check for rapid session creation
      const recentSessions = sessions.filter(s => {
        const createdAt = new Date(s.created_at);
        return Date.now() - createdAt.getTime() < 60 * 60 * 1000; // 1 hour
      });

      if (recentSessions.length > 5) {
        await logSecurityEvent('suspicious_rapid_sessions', {
          userId: user.id,
          recentSessionCount: recentSessions.length,
          sessionId
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }
}

export const sessionManager = new SessionManager();