import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FeatureGatingService } from '@/services/featureGatingService';

interface GenerateMarketingImageParams {
  prompt: string;
  style?: string;
  num_steps?: number;
  contentId?: string;
}

interface GeneratedMarketingImage {
  success: boolean;
  image_url: string;
  filename: string;
  prompt: string;
  revised_prompt?: string;
  error?: string;
}

export const useMarketingImageGeneration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateMarketingImageMutation = useMutation({
    mutationFn: async (params: GenerateMarketingImageParams): Promise<GeneratedMarketingImage> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check feature access and deduct credits (5 credits per marketing image)
      try {
        await FeatureGatingService.checkAndIncrementUsage(
          user.id,
          'marketing_image_generation',
          5, // 5 credits per marketing image
          false // not a dry run, actually deduct credits
        );
      } catch (error: any) {
        if (error.type === 'QUOTA_EXCEEDED' || error.type === 'PLAN_LIMIT') {
          throw new Error('Insufficient credits or plan access for marketing image generation');
        }
        throw error;
      }

      // Generate marketing image using edge function
      const { data, error } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          prompt: params.prompt,
          style: params.style || 'none',
          num_steps: params.num_steps || 50
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate marketing image');
      }

      if (!data.success) {
        throw new Error(data.error || 'Marketing image generation failed');
      }

      // Store image metadata in database
      const { error: dbError } = await supabase
        .from('image_assets')
        .insert({
          user_id: user.id,
          content_id: params.contentId || null,
          image_url: data.image_url,
          image_type: 'marketing',
          prompt: params.prompt,
          storage_path: data.filename,
          generation_params: {
            style: params.style,
            num_steps: params.num_steps,
            generator: 'huggingface_mcp'
          }
        });

      if (dbError) {
        console.error('Error storing marketing image metadata:', dbError);
        // Don't fail the whole operation for this
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Marketing image generated successfully! 5 credits used.');
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
    },
    onError: (error: any) => {
      console.error('Marketing image generation error:', error);
      toast.error(error.message || 'Failed to generate marketing image');
    }
  });

  return {
    generateMarketingImage: generateMarketingImageMutation.mutateAsync,
    isGenerating: generateMarketingImageMutation.isPending,
    error: generateMarketingImageMutation.error
  };
};