import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FeatureGatingService } from '@/services/featureGatingService';

interface GenerateImageParams {
  prompt: string;
  style?: 'natural' | 'vivid';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  contentId?: string;
  imageType?: string;
}

interface GeneratedImage {
  success: boolean;
  image_url: string;
  filename: string;
  prompt: string;
  revised_prompt?: string;
  error?: string;
}

export const useImageGeneration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateImageMutation = useMutation({
    mutationFn: async (params: GenerateImageParams): Promise<GeneratedImage> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check feature access and deduct credits (5 credits per image)
      try {
        await FeatureGatingService.checkAndIncrementUsage(
          user.id,
          'image_generation',
          5, // 5 credits per image
          false // not a dry run, actually deduct credits
        );
      } catch (error: any) {
        if (error.type === 'QUOTA_EXCEEDED' || error.type === 'PLAN_LIMIT') {
          throw new Error('Insufficient credits or plan access for image generation');
        }
        throw error;
      }

      // Generate image using edge function
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          style: params.style || 'natural',
          size: params.size || '1024x1024',
          quality: params.quality || 'standard'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (!data.success) {
        throw new Error(data.error || 'Image generation failed');
      }

      // Store image metadata in database
      const { error: dbError } = await supabase
        .from('image_assets')
        .insert({
          user_id: user.id,
          content_id: params.contentId || null,
          image_url: data.image_url,
          image_type: params.imageType || 'generated',
          prompt: params.prompt,
          storage_path: data.filename,
          generation_params: {
            style: params.style,
            size: params.size,
            quality: params.quality,
            revised_prompt: data.revised_prompt
          }
        });

      if (dbError) {
        console.error('Error storing image metadata:', dbError);
        // Don't fail the whole operation for this
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Image generated successfully! 5 credits used.');
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
    },
    onError: (error: any) => {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    }
  });

  return {
    generateImage: generateImageMutation.mutateAsync,
    isGenerating: generateImageMutation.isPending,
    error: generateImageMutation.error
  };
};