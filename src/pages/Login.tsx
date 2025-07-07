
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import rocketLogo from "@/assets/rocket_svg.svg";
import { useAuthMutations } from "@/hooks/useAuthMutations";
import AuthGuard from "@/components/AuthGuard";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  
  const { signIn, resendConfirmation } = useAuthMutations();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';
  const successMessage = location.state?.message;
  const prefilledEmail = location.state?.email;

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const validateInputs = () => {
    if (!email.trim()) return "Email is required";
    if (!password.trim()) return "Password is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateInputs();
    if (validationError) return;

    try {
      await signIn.mutateAsync({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login form error:', error);
      if (error.message.includes('Invalid credentials') || error.message.includes('Email not confirmed')) {
        setShowResendConfirmation(true);
      }
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    try {
      await resendConfirmation.mutateAsync(email.trim().toLowerCase());
      setShowResendConfirmation(false);
    } catch (error) {
      console.error('Resend confirmation error:', error);
    }
  };

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <img 
                    src={rocketLogo} 
                    alt="Rocket Logo" 
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Launch Click
                </span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={signIn.isPending}
                  className="mt-1"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={signIn.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={signIn.isPending}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={signIn.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {signIn.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {showResendConfirmation && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 mb-2">
                      Account not confirmed? Check your email or resend confirmation.
                    </p>
                    <Button
                      onClick={handleResendConfirmation}
                      disabled={resendConfirmation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {resendConfirmation.isPending ? "Sending..." : "Resend Confirmation Email"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link 
                to="/forgot-password" 
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Login;
