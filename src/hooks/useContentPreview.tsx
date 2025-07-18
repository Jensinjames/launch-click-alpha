import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentPreview {
  id: string;
  title: string;
  type: string;
  content: any;
  created_at: string;
  is_favorite: boolean;
}

export const useContentPreview = (contentId: string) => {
  return useQuery({
    queryKey: ['content-preview', contentId],
    queryFn: async (): Promise<ContentPreview | null> => {
      if (!contentId) return null;

      const { data, error } = await supabase
        .from('generated_content')
        .select('id, title, type, content, created_at, is_favorite')
        .eq('id', contentId)
        .single();

      if (error) {
        console.error('Error fetching content preview:', error);
        throw error;
      }

      return data;
    },
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};