// Optimized Session Management Service with Performance Improvements
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/security';

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

interface CachedActivity {
  lastActivity: string;
  lastSynced: number;
  fingerprint?: string;
}

class OptimizedSessionManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private activityThrottleTimer: NodeJS.Timeout | null = null;
  private fingerprintWorker: Worker | null = null;
  private pendingUpdates: Set<string> = new Set();
  
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly THROTTLE_INTERVAL = 30 * 1000; // 30 seconds
  private readonly CACHE_KEY = 'session_activity_cache';
  
  constructor() {
    this.initializeWorker();
  }

  // Initialize Web Worker for fingerprinting
  private initializeWorker(): void {
    try {
      const workerBlob = new Blob([`
        self.onmessage = async function(e) {
          const { type } = e.data;
          
          if (type === 'generateFingerprint') {
            try {
              const canvas = new OffscreenCanvas(200, 50);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('Security fingerprint', 2, 2);
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Performance optimized', 4, 17);
              }
              
              const fingerprint = [
                self.navigator.userAgent,
                self.navigator.language,
                self.screen.width + 'x' + self.screen.height,
                new Date().getTimezoneOffset().toString(),
                canvas ? await canvas.convertToBlob().then(blob => blob.size.toString()) : 'unknown'
              ].join('|');
              
              const encoder = new TextEncoder();
              const data = encoder.encode(fingerprint);
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              self.postMessage({ 
                type: 'fingerprintGenerated', 
                fingerprint: hash 
              });
            } catch (error) {
              self.postMessage({ 
                type: 'fingerprintError', 
                error: 'Failed to generate fingerprint' 
              });
            }
          }
        };
      `], { type: 'application/javascript' });
      
      this.fingerprintWorker = new Worker(URL.createObjectURL(workerBlob));
      this.fingerprintWorker.onmessage = this.handleWorkerMessage.bind(this);
    } catch (error) {
      console.warn('Failed to initialize fingerprint worker:', error);
    }
  }

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type, fingerprint, error } = e.data;
    
    if (type === 'fingerprintGenerated') {
      this.updateCachedFingerprint(fingerprint);
    } else if (type === 'fingerprintError') {
      console.warn('Fingerprint generation failed:', error);
    }
  };

  // Cache management
  private getCachedActivity(): CachedActivity | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCachedActivity(activity: CachedActivity): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(activity));
    } catch (error) {
      console.warn('Failed to cache activity:', error);
    }
  }

  private updateCachedFingerprint(fingerprint: string): void {
    const cached = this.getCachedActivity();
    if (cached) {
      cached.fingerprint = fingerprint;
      this.setCachedActivity(cached);
    }
  }

  // Initialize session tracking with caching
  async initializeSession(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      
      // Update cache immediately
      this.setCachedActivity({
        lastActivity: now,
        lastSynced: Date.now()
      });

      // Generate fingerprint in worker (non-blocking)
      if (this.fingerprintWorker) {
        this.fingerprintWorker.postMessage({ type: 'generateFingerprint' });
      }

      // Create or update session record
      await supabase.from('user_sessions').upsert({
        user_id: user.id,
        session_id: sessionId,
        last_activity: now,
        expires_at: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString(),
        user_agent: navigator.userAgent
      });

      // Start optimized monitoring
      this.startOptimizedMonitoring();

      await logSecurityEvent('session_initialized', {
        sessionId,
        userId: user.id,
        userAgent: navigator.userAgent
      });

    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  // Throttled activity update
  updateActivity = (sessionId: string): void => {
    // Update cache immediately for responsiveness
    const cached = this.getCachedActivity();
    if (cached) {
      cached.lastActivity = new Date().toISOString();
      this.setCachedActivity(cached);
    }

    // Add to pending updates
    this.pendingUpdates.add(sessionId);

    // Throttle database updates
    if (this.activityThrottleTimer) return;

    this.activityThrottleTimer = setTimeout(() => {
      this.batchUpdateActivities();
      this.activityThrottleTimer = null;
    }, this.THROTTLE_INTERVAL);
  };

  // Batch update activities using requestIdleCallback
  private batchUpdateActivities(): void {
    if (this.pendingUpdates.size === 0) return;

    const updateBatch = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    const performUpdate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const cached = this.getCachedActivity();
        const now = cached?.lastActivity || new Date().toISOString();

        // Batch update all pending sessions
        for (const sessionId of updateBatch) {
          await supabase
            .from('user_sessions')
            .update({
              last_activity: now,
              expires_at: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString()
            })
            .eq('session_id', sessionId)
            .eq('user_id', user.id);
        }

        // Update cache sync timestamp
        if (cached) {
          cached.lastSynced = Date.now();
          this.setCachedActivity(cached);
        }

      } catch (error) {
        console.error('Failed to batch update activities:', error);
      }
    };

    // Use requestIdleCallback for better performance
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(performUpdate, { timeout: 10000 });
    } else {
      // Fallback for environments without requestIdleCallback
      setTimeout(performUpdate, 0);
    }
  }

  // Check for session timeout with caching
  async checkSessionTimeout(sessionId: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = this.getCachedActivity();
      if (cached) {
        const timeSinceSync = Date.now() - cached.lastSynced;
        const lastActivity = new Date(cached.lastActivity);
        const timeSinceActivity = Date.now() - lastActivity.getTime();
        
        // If cache is recent and activity is within timeout, skip DB check
        if (timeSinceSync < 60000 && timeSinceActivity < this.SESSION_TIMEOUT) {
          return false;
        }
      }

      const { data: session } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (!session) return true;

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      
      if (now > expiresAt) {
        await this.expireSession(sessionId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check session timeout:', error);
      return true;
    }
  }

  // Expire a session
  async expireSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      // Clear cache
      localStorage.removeItem(this.CACHE_KEY);

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

  // Terminate all other sessions
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

  // Start optimized session monitoring
  private startOptimizedMonitoring(): void {
    if (this.sessionCheckInterval) return;

    this.sessionCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.updateActivity(session.access_token);
        
        // Check session timeout less frequently
        const isExpired = await this.checkSessionTimeout(session.access_token);
        if (isExpired) {
          await supabase.auth.signOut();
        }
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  // Stop session monitoring and cleanup
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    if (this.activityThrottleTimer) {
      clearTimeout(this.activityThrottleTimer);
      this.activityThrottleTimer = null;
    }

    if (this.fingerprintWorker) {
      this.fingerprintWorker.terminate();
      this.fingerprintWorker = null;
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  // Detect suspicious activity (cached when possible)
  async detectSuspiciousActivity(sessionId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const sessions = await this.getUserSessions(user.id);
      
      const activeSessions = sessions.filter(s => s.is_active);
      if (activeSessions.length > 3) {
        await logSecurityEvent('suspicious_multiple_sessions', {
          userId: user.id,
          sessionCount: activeSessions.length,
          sessionId
        });
        return true;
      }

      const recentSessions = sessions.filter(s => {
        const createdAt = new Date(s.created_at);
        return Date.now() - createdAt.getTime() < 60 * 60 * 1000;
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

export const optimizedSessionManager = new OptimizedSessionManager();