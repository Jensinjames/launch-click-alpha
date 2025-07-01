import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type GeneratedContent = Database['public']['Tables']['generated_content']['Row'];

export const useUserContent = (filters?: {
  type?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'title' | 'favorites';
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-content', user?.id, filters],
    queryFn: async (): Promise<GeneratedContent[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type as any);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,prompt.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        case 'favorites':
          query = query.order('is_favorite', { ascending: false })
                      .order('created_at', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user content:', error);
        throw new Error('Failed to fetch content');
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useContentGeneration = () => {
  const { user } = useAuth();

  return {
    generateContent: async (params: {
      type: string;
      prompt: string;
      title?: string;
      tone?: string;
      audience?: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: params
      });

      if (error) {
        throw error;
      }

      return data;
    }
  };
};