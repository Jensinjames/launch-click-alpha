// Simplified Security Provider for Build Compatibility
import { useEffect, ReactNode } from 'react';
import { initializeSecurity } from '@/utils/securityHeaders';

interface EnhancedSecurityProviderProps {
  children: ReactNode;
}

export const EnhancedSecurityProvider = ({ children }: EnhancedSecurityProviderProps) => {
  useEffect(() => {
    // Simple security initialization only
    try {
      initializeSecurity();
    } catch (error) {
      console.warn('Security initialization failed:', error);
    }
  }, []);

  return <>{children}</>;
};