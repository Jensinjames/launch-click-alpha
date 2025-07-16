
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authLogger } from '@/services/logger/domainLoggers';
import rocketLogo from "@/assets/rocket_svg.svg";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  redirectTo 
}: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      // User should be authenticated but isn't
      authLogger.userAction('redirect_to_login', 'auth_guard', { 
        from: location.pathname,
        reason: 'user_not_authenticated' 
      });
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    } else if (!requireAuth && user && redirectTo) {
      // User is authenticated but shouldn't be (e.g., on login page)
      authLogger.userAction('redirect_authenticated_user', 'auth_guard', { 
        from: location.pathname,
        to: redirectTo,
        userId: user.id 
      });
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, requireAuth, navigate, location.pathname, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <img 
                  src={rocketLogo} 
                  alt="Rocket Logo" 
                  className="h-8 w-8 object-contain animate-pulse"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Launch Click
              </span>
            </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user && redirectTo) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
