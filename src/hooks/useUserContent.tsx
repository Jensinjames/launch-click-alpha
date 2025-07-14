import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ContentService } from '@/features/content/services/ContentService';
import type { ContentItem, ContentQueryParams } from '@/features/content/types';

export const useUserContent = (filters?: {
  type?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'title' | 'favorites';
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-content', user?.id, filters],
    queryFn: async (): Promise<ContentItem[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const params: ContentQueryParams = {
        type: filters?.type as any,
        search: filters?.search,
        sortBy: filters?.sortBy,
      };

      return ContentService.getContent(params);
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