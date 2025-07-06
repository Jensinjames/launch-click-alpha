import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type ImageAsset = Database['public']['Tables']['image_assets']['Row'];
type MarketingImageJob = Database['public']['Tables']['marketing_image_jobs']['Row'];

export interface UserImage {
  id: string;
  imageUrl: string;
  prompt: string;
  name: string;
  type: 'pipeline' | 'marketing';
  created_at: string;
  width?: number;
  height?: number;
  file_size?: number;
  generation_params?: any;
  status?: string;
}

export const useUserImages = (limit: number = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-images', user?.id, limit],
    queryFn: async (): Promise<UserImage[]> => {
      if (!user) return [];

      // Fetch pipeline images from image_assets
      const { data: pipelineImages, error: pipelineError } = await supabase
        .from('image_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pipelineError) {
        console.error('Error fetching pipeline images:', pipelineError);
      }

      // Fetch marketing images from marketing_image_jobs
      const { data: marketingImages, error: marketingError } = await supabase
        .from('marketing_image_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (marketingError) {
        console.error('Error fetching marketing images:', marketingError);
      }

      const images: UserImage[] = [];

      // Process pipeline images
      if (pipelineImages) {
        pipelineImages.forEach(img => {
          images.push({
            id: img.id,
            imageUrl: img.image_url,
            prompt: img.prompt || 'No prompt available',
            name: `Pipeline Image ${new Date(img.created_at || '').toLocaleDateString()}`,
            type: 'pipeline',
            created_at: img.created_at || '',
            width: img.width || undefined,
            height: img.height || undefined,
            file_size: img.file_size ? Number(img.file_size) : undefined,
            generation_params: img.generation_params
          });
        });
      }

      // Process marketing images (only completed ones with URLs)
      if (marketingImages) {
        marketingImages
          .filter(img => img.status === 'completed' && img.image_url)
          .forEach(img => {
            images.push({
              id: img.id,
              imageUrl: img.image_url!,
              prompt: img.prompt,
              name: `Marketing Image ${new Date(img.created_at || '').toLocaleDateString()}`,
              type: 'marketing',
              created_at: img.created_at || '',
              generation_params: img.generation_params,
              status: img.status
            });
          });
      }

      // Sort all images by creation date (newest first)
      return images.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
};

export const useRecentImages = (limit: number = 5) => {
  return useUserImages(limit);
};