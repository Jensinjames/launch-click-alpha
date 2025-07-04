
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdminAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-access', user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false, isSuperAdmin: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return {
        isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
        isSuperAdmin: profile?.role === 'super_admin',
        role: profile?.role || 'user'
      };
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes - user roles don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};
