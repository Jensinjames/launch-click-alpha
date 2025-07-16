
import { useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { secureLog, performSecurityChecks } from '@/utils/security';
import { AuthContext } from '@/contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoized cleanup function
  const performCleanup = useCallback(() => {
    // AuthProvider performing cleanup
    setUser(null);
    setSession(null);
    
    // Clear storage more efficiently
    try {
      sessionStorage.clear();
      
      // Only clear Supabase-related localStorage keys
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // AuthProvider storage cleanup failed
    }
  }, []);

  useEffect(() => {
    // Perform security checks on initialization (non-blocking)
    const securityCheck = performSecurityChecks();
    if (!securityCheck.secure) {
      secureLog('warn', 'Security warnings detected', securityCheck.warnings);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // AuthProvider auth state changed
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle auth events efficiently
        switch (event) {
          case 'SIGNED_IN':
            // AuthProvider user signed in successfully
            secureLog('info', 'User signed in', { userId: session?.user?.id });
            break;
            
          case 'SIGNED_OUT':
            // AuthProvider user signed out - clearing state
            secureLog('info', 'User signed out');
            performCleanup();
            break;
            
          case 'TOKEN_REFRESHED':
            secureLog('info', 'Token refreshed successfully');
            break;
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // AuthProvider error getting session
        secureLog('error', 'Error getting session', error);
        // Don't show toast for initial session check failures
      }
      
      // AuthProvider initial session check completed
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      // AuthProvider cleaning up auth subscription
      subscription.unsubscribe();
    };
  }, [performCleanup]);

  const value = {
    user,
    session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
