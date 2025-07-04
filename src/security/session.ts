// Unified Session Management - Simple, Non-Recursive
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from './logger';

export interface SessionInfo {
  id: string;
  user_id: string;
  session_id: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
}

class UnifiedSessionManager {
  private sessionUpdateThrottle: Map<string, number> = new Map();
  private readonly THROTTLE_WINDOW = 30 * 1000; // 30 seconds

  // Initialize session with simple approach
  async initializeSession(sessionToken: string): Promise<void> {
    try {
      await logSecurityEvent('session_initialized', {
        sessionId: sessionToken.slice(-8) // Only log last 8 chars for security
      });
    } catch (error) {
      console.warn('Failed to initialize session tracking:', error);
    }
  }

  // Update activity with throttling to prevent spam
  async updateActivity(sessionToken: string): Promise<void> {
    const now = Date.now();
    const lastUpdate = this.sessionUpdateThrottle.get(sessionToken) || 0;
    
    // Throttle updates to prevent excessive database calls
    if (now - lastUpdate < this.THROTTLE_WINDOW) {
      return;
    }
    
    this.sessionUpdateThrottle.set(sessionToken, now);
    
    try {
      // Simple activity update without complex logging
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('session_id', sessionToken)
        .eq('is_active', true);
        
      if (error) {
        console.warn('Failed to update session activity:', error);
      }
    } catch (error) {
      console.warn('Session activity update failed:', error);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_expired_sessions');
      
      if (error) {
        console.warn('Session cleanup failed:', error);
      }
    } catch (error) {
      console.warn('Session cleanup error:', error);
    }
  }

  // Detect suspicious activity (simplified)
  async detectSuspiciousActivity(sessionToken: string): Promise<boolean> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true);

      if (error) {
        console.warn('Failed to check suspicious activity:', error);
        return false;
      }

      // Simple check: more than 3 active sessions is suspicious
      const suspiciousThreshold = 3;
      const isSuspicious = (sessions?.length || 0) > suspiciousThreshold;
      
      if (isSuspicious) {
        await logSecurityEvent('suspicious_multiple_sessions', {
          sessionCount: sessions?.length || 0,
          currentSessionId: sessionToken.slice(-8)
        });
      }
      
      return isSuspicious;
    } catch (error) {
      console.warn('Suspicious activity detection failed:', error);
      return false;
    }
  }

  // Stop session monitoring
  stopSessionMonitoring(): void {
    this.sessionUpdateThrottle.clear();
    // Simple cleanup without complex operations
  }
}

// Export singleton instance
export const unifiedSessionManager = new UnifiedSessionManager();

// Simplified session helpers
export const initializeSession = (sessionToken: string) => 
  unifiedSessionManager.initializeSession(sessionToken);

export const updateSessionActivity = (sessionToken: string) => 
  unifiedSessionManager.updateActivity(sessionToken);

export const cleanupExpiredSessions = () => 
  unifiedSessionManager.cleanupExpiredSessions();

export const detectSuspiciousActivity = (sessionToken: string) => 
  unifiedSessionManager.detectSuspiciousActivity(sessionToken);

export const stopSessionMonitoring = () => 
  unifiedSessionManager.stopSessionMonitoring();