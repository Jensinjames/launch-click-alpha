// Admin Route Protection with Enhanced Security
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEnhancedAdminAccess } from '../hooks/useEnhancedAdminAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock, Loader2, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredFeature?: string;
  requireRecentAuth?: boolean;
  fallbackPath?: string;
}

const AdminRouteGuard = ({ 
  children, 
  requiredFeature,
  requireRecentAuth = false,
  fallbackPath = '/dashboard'
}: AdminRouteGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const {
    hasAccess,
    hasFeatureAccess,
    requiresRecentAuth,
    sessionValid,
    isLoading,
    isError,
    error,
    requireRecentAuth: validateRecentAuth,
    permissions,
    role,
    planType,
    refetch
  } = useEnhancedAdminAccess();

  // Handle recent authentication requirement
  const handleRecentAuthCheck = async () => {
    if (!requireRecentAuth && !requiresRecentAuth) return true;
    
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      const isValid = await validateRecentAuth();
      if (!isValid) {
        setAuthError('Recent authentication required for this action');
        return false;
      }
      return true;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Check feature access if required
  const hasRequiredFeatureAccess = requiredFeature ? 
    hasFeatureAccess(requiredFeature) : true;

  // Redirect if no admin access at all
  useEffect(() => {
    if (!isLoading && !hasAccess && !isError) {
      console.log('[AdminRouteGuard] No admin access, redirecting to:', fallbackPath);
      navigate(fallbackPath, { 
        replace: true,
        state: { from: location.pathname, reason: 'no_admin_access' }
      });
    }
  }, [hasAccess, isLoading, isError, navigate, fallbackPath, location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4 animate-pulse" />
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verifying Admin Access</h3>
            <p className="text-muted-foreground text-sm">
              Checking permissions and security requirements...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (isError || !sessionValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">
              Admin Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error?.message || "Unable to verify admin permissions"}
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your admin session may have expired or your account may not have sufficient privileges.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => refetch()} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Verification
              </Button>
              <Link to={fallbackPath}>
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access but lacks required feature
  if (hasAccess && !hasRequiredFeatureAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-xl font-bold">
              Feature Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your admin role ({role}) with {planType} plan doesn't have access to this feature.
            </p>
            {requiredFeature && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <strong>Required feature:</strong> {requiredFeature}
              </div>
            )}
            <div className="space-y-2">
              <Link to="/admin">
                <Button className="w-full">
                  Admin Dashboard
                </Button>
              </Link>
              <Link to={fallbackPath}>
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check recent authentication requirement
  if ((requireRecentAuth || requiresRecentAuth) && !isAuthenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-xl font-bold">
              Recent Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This admin feature requires recent authentication for security.
            </p>
            {authError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button 
                onClick={handleRecentAuthCheck} 
                disabled={isAuthenticating}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Identity
                  </>
                )}
              </Button>
              <Link to="/admin">
                <Button variant="outline" className="w-full">
                  Back to Admin Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticating recent auth
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verifying Identity</h3>
            <p className="text-muted-foreground text-sm">
              Checking recent authentication status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - render protected content
  return <>{children}</>;
};

export default AdminRouteGuard;