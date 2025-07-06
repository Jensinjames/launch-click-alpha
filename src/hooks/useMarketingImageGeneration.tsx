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
  generation_params?: any;
  error?: string;
}

export const useMarketingImageGeneration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateMarketingImageMutation = useMutation({
    mutationFn: async (params: GenerateMarketingImageParams): Promise<GeneratedMarketingImage> => {
      console.log('[MarketingImageGeneration] Starting generation with params:', params);
      
      if (!user) {
        console.error('[MarketingImageGeneration] User not authenticated');
        throw new Error('User not authenticated');
      }

      // Verify authentication session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('[MarketingImageGeneration] No valid session:', sessionError);
        throw new Error('Authentication session expired. Please log in again.');
      }

      console.log('[MarketingImageGeneration] Authentication verified, checking feature access');

      // Check feature access and deduct credits (5 credits per marketing image)
      try {
        await FeatureGatingService.checkAndIncrementUsage(
          user.id,
          'marketing_image_generation',
          5, // 5 credits per marketing image
          false // not a dry run, actually deduct credits
        );
        console.log('[MarketingImageGeneration] Feature access verified, credits deducted');
      } catch (error: any) {
        console.error('[MarketingImageGeneration] Feature access error:', error);
        if (error.type === 'QUOTA_EXCEEDED' || error.type === 'PLAN_LIMIT') {
          throw new Error('Insufficient credits or plan access for marketing image generation');
        }
        throw error;
      }

      console.log('[MarketingImageGeneration] Calling edge function with payload:', {
        prompt: params.prompt,
        style: params.style || 'none',
        steps: params.num_steps || 50
      });

      // Generate marketing image using edge function
      let data: any;
      try {
        const response = await supabase.functions.invoke('generate-marketing-image', {
          body: {
            prompt: params.prompt,
            style: params.style || 'none',
            steps: params.num_steps || 50
          }
        });

        console.log('[MarketingImageGeneration] Edge function response:', response);

        if (response.error) {
          console.error('[MarketingImageGeneration] Edge function error:', response.error);
          throw new Error(`Edge function error: ${response.error.message || JSON.stringify(response.error)}`);
        }

        if (!response.data) {
          console.error('[MarketingImageGeneration] No data returned from edge function');
          throw new Error('No data returned from image generation service');
        }

        data = response.data;

        if (!data.success) {
          console.error('[MarketingImageGeneration] Generation failed:', data.error);
          throw new Error(data.error || 'Marketing image generation failed');
        }

        console.log('[MarketingImageGeneration] Image generated successfully');
      } catch (invokeError: any) {
        console.error('[MarketingImageGeneration] supabase.functions.invoke failed:', invokeError);
        
        // Handle specific timeout errors
        if (invokeError.message?.includes('timed out') || invokeError.message?.includes('timeout')) {
          throw new Error('Image generation timed out. AI models can be slow - please try again.');
        }
        
        // Handle other Edge Function errors
        if (invokeError.message?.includes('Edge function error')) {
          throw new Error(`Image generation failed: ${invokeError.message.replace('Edge function error:', '').trim()}`);
        }
        
        throw new Error(`Failed to connect to image generation service: ${invokeError.message}`);
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
          storage_path: data.filename || `marketing_${Date.now()}.png`,
          generation_params: data.generation_params || {
            style: params.style,
            num_steps: params.num_steps,
            generator: 'huggingface_gradio'
          }
        });

      if (dbError) {
        console.error('Error storing marketing image metadata:', dbError);
        // Don't fail the whole operation for this
      }

      return {
        success: data.success,
        image_url: data.image_url,
        filename: data.filename || `marketing_${Date.now()}.png`,
        prompt: data.prompt,
        generation_params: data.generation_params
      };
    },
    onSuccess: (data) => {
      toast.success('Marketing image generated successfully! 5 credits used.');
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
    },
    onError: (error: any) => {
      console.error('Marketing image generation error:', error);
      
      // Show user-friendly error messages
      if (error.message?.includes('timed out') || error.message?.includes('timeout')) {
        toast.error('Image generation timed out. Please try again - AI models can take time to process.');
      } else if (error.message?.includes('credits') || error.message?.includes('quota')) {
        toast.error('Insufficient credits for image generation. Please upgrade your plan.');
      } else {
        toast.error(error.message || 'Failed to generate marketing image');
      }
    }
  });

  return {
    generateMarketingImage: generateMarketingImageMutation.mutateAsync,
    isGenerating: generateMarketingImageMutation.isPending,
    error: generateMarketingImageMutation.error
  };
};