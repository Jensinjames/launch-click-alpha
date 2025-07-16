
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/auth/FormField";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuthMutations } from "@/hooks/useAuthMutations";
import { Loader2 } from "lucide-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { signUp } = useAuthMutations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      return;
    }
    
    signUp.mutate({ email, password, fullName });
  };

  const isFormValid = email && password && isPasswordValid && fullName;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="fullName"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={setFullName}
              required
              label="Full Name"
              autoComplete="name"
            />
            
            <FormField
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              required
              label="Email"
              autoComplete="email"
            />
            
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              label="Password"
              showStrengthIndicator={true}
              onValidationChange={setIsPasswordValid}
              required
              autoComplete="new-password"
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={signUp.isPending || !isFormValid}
            >
              {signUp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
