import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X, Rocket, Users, Zap } from 'lucide-react';
import { useCompleteOnboarding } from '@/hooks/useCompleteOnboarding';

interface OnboardingBannerProps {
  onComplete?: () => void;
}

export const OnboardingBanner = ({ onComplete }: OnboardingBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const completeOnboarding = useCompleteOnboarding();

  const handleComplete = async () => {
    try {
      await completeOnboarding.mutateAsync();
      setIsVisible(false);
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Welcome to LaunchClick! 🚀
              </h3>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Complete your account setup to unlock all features and start creating amazing marketing content.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Account created</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Email verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Ready to launch!</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleComplete}
                disabled={completeOnboarding.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {completeOnboarding.isPending ? (
                  "Completing setup..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Maybe later
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};