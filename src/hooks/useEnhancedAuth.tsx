
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { validateAdminAccess } from '@/security';
import { useQuery } from '@tanstack/react-query';

export const useEnhancedAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider');
  }

  // Admin access validation with server-side verification
  const { data: isAdminValid, isLoading: isValidatingAdmin } = useQuery({
    queryKey: ['admin-validation', context.user?.id],
    queryFn: validateAdminAccess,
    enabled: !!context.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Re-validate every 10 minutes
  });

  return {
    ...context,
    isAdminValid: isAdminValid || false,
    isValidatingAdmin,
  };
};
