
import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { supabase } from '@/integrations/supabase/client';
import { validateAdminAccessEnhanced, logSecurityEvent } from '@/security';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminSecurityWrapperProps {
  children: ReactNode;
  requireRecentAuth?: boolean;
  requireFreshSession?: boolean;
  maxSessionAge?: number;
  sensitiveOperation?: string;
  emergencyMode?: boolean; // Simple mode using useAdminAccess hook
}

export const AdminSecurityWrapper = ({ 
  children, 
  requireRecentAuth = false,
  requireFreshSession = false,
  maxSessionAge = 30,
  sensitiveOperation,
  emergencyMode = false
}: AdminSecurityWrapperProps) => {
  const { user } = useAuth();
  const { data: adminData, isLoading: emergencyLoading, error: emergencyError } = useAdminAccess();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Emergency mode - use simple useAdminAccess hook
  if (emergencyMode) {
    if (emergencyLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking admin access...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (emergencyError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold text-destructive">
                Access Check Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-destructive/80">
                Unable to verify admin access. Please try again.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!adminData?.isAdmin) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold text-destructive">
                Admin Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-destructive/80">
                You need administrator privileges to access this area.
              </p>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <>{children}</>;
  }

  useEffect(() => {
    let mounted = true;

    const validateAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        setError(null);
        
        // Log admin access attempt
        await logSecurityEvent('admin_access_attempt', {
          userId: user.id,
          requireRecentAuth,
          sensitiveOperation,
          email: user.email
        });

        // First check basic admin access
        let isValid = await validateAdminAccessEnhanced(requireRecentAuth);
        
        // Additional check for fresh session if required
        if (isValid && requireFreshSession) {
          try {
            const { data: sessionValid, error: sessionError } = await supabase.rpc('require_fresh_admin_session', {
              max_age_minutes: maxSessionAge
            });
            
            if (sessionError || !sessionValid) {
              isValid = false;
              await logSecurityEvent('admin_access_denied', {
                userId: user.id,
                sensitiveOperation,
                error: sessionError?.message || 'Session validation failed'
              });
            }
          } catch (err) {
            console.error('[AdminSecurityWrapper] Session validation error:', err);
            isValid = false;
          }
        }
        
        if (mounted) {
          setHasAccess(isValid);
          
          if (!isValid) {
            await logSecurityEvent('admin_access_denied', {
              userId: user.id,
              sensitiveOperation,
              error: requireFreshSession 
                ? 'fresh_session_required' 
                : requireRecentAuth 
                  ? 'recent_auth_required' 
                  : 'insufficient_privileges'
            });
            
            setError(
              requireFreshSession
                ? `This sensitive operation requires recent authentication (within ${maxSessionAge} minutes). Please sign in again.`
                : requireRecentAuth 
                  ? 'This action requires recent authentication. Please sign in again.'
                  : 'Access denied. Insufficient administrative privileges.'
            );
          }
        }
      } catch (err) {
        if (mounted) {
          await logSecurityEvent('admin_validation_error', {
            userId: user?.id,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
          
          setError('Security validation failed. Please try again.');
          setHasAccess(false);
        }
      } finally {
        if (mounted) {
          setIsValidating(false);
        }
      }
    };

    validateAccess();
    
    // Re-validate every 15 minutes for sensitive operations
    const interval = requireRecentAuth ? setInterval(validateAccess, 15 * 60 * 1000) : null;

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [user, requireRecentAuth, sensitiveOperation]);

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              {requireRecentAuth ? (
                <Shield className="h-6 w-6 text-destructive" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <CardTitle className="text-xl font-bold text-destructive">
              {requireRecentAuth ? 'Recent Authentication Required' : 'Access Denied'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-destructive/80">
              {error || 'You do not have permission to access this area.'}
            </p>
            <div className="space-y-2">
              {requireRecentAuth ? (
                <Link to="/login">
                  <Button className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Re-authenticate
                  </Button>
                </Link>
              ) : (
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Validation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted - render children
  return <>{children}</>;
};
