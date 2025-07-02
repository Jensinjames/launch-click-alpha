import { useAuth } from "@/hooks/useAuth";
import { useCanUseFeature } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Zap, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  graceful?: boolean;
  showUpgrade?: boolean;
  mode?: 'page' | 'feature' | 'component';
}

const FeatureGate = ({ 
  featureName,
  children, 
  fallback,
  graceful = false,
  showUpgrade = true,
  mode = 'feature'
}: FeatureGateProps) => {
  const { user } = useAuth();
  const { canUse, isLoading, error } = useCanUseFeature(featureName);
  
  // Show loading state while checking access
  if (isLoading) {
    if (mode === 'component') {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if access check failed
  if (error || !user) {
    if (mode === 'component') {
      return fallback || (
        <div className="p-4 text-center text-muted-foreground">
          Access unavailable
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error?.message || "Please sign in to continue."}
            </p>
            <div className="space-y-2">
              <Link to="/login">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
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

  // Check if user has access to the feature
  if (canUse) {
    return <>{children}</>;
  }

  // For graceful degradation, show limited version instead of blocking
  if (graceful && fallback) {
    return <>{fallback}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Component mode - just return null or minimal message
  if (mode === 'component') {
    return showUpgrade ? (
      <div className="p-4 text-center border border-border rounded-lg bg-muted/50">
        <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          This feature requires an upgrade
        </p>
        <Link to="/pricing">
          <Button size="sm" variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    ) : null;
  }

  // Page mode - show full upgrade prompt
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">
            Upgrade Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This feature requires a higher plan to access.
          </p>
          <div className="space-y-2">
            {showUpgrade && (
              <Link to="/pricing">
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureGate;