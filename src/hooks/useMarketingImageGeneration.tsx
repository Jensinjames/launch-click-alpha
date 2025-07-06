import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FeatureGatingService } from '@/services/featureGatingService';
import { useState, useEffect } from 'react';

interface GenerateMarketingImageParams {
  prompt: string;
  style?: string;
  num_steps?: number;
  contentId?: string;
}

interface MarketingImageJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  style: string;
  steps: number;
  image_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Hook for starting a marketing image generation job
const useStartMarketingImageJob = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateMarketingImageParams): Promise<{ job_id: string }> => {
      console.log('[MarketingImageGeneration] Starting job with params:', params);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check feature access and deduct credits
      await FeatureGatingService.checkAndIncrementUsage(
        user.id,
        'marketing_image_generation',
        5, // 5 credits per marketing image
        false
      );

      const response = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          prompt: params.prompt,
          style: params.style || 'none',
          steps: params.num_steps || 50
        }
      });

      if (response.error) {
        throw new Error(`Edge function error: ${response.error.message || JSON.stringify(response.error)}`);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to start image generation job');
      }

      return { job_id: response.data.job_id };
    },
    onError: (error: any) => {
      console.error('Marketing image job start error:', error);
      if (error.message?.includes('credits') || error.message?.includes('quota')) {
        toast.error('Insufficient credits for image generation. Please upgrade your plan.');
      } else {
        toast.error(error.message || 'Failed to start image generation');
      }
    }
  });
};

// Hook for checking job status
const useMarketingImageJobStatus = (jobId: string | null) => {
  return useQuery<MarketingImageJob>({
    queryKey: ['marketing-image-job', jobId],
    queryFn: async (): Promise<MarketingImageJob> => {
      if (!jobId) throw new Error('No job ID provided');

      const { data, error } = await supabase
        .from('marketing_image_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        job_id: data.id,
        status: data.status as 'pending' | 'processing' | 'completed' | 'failed',
        prompt: data.prompt,
        style: data.style,
        steps: data.steps,
        image_url: data.image_url,
        error_message: data.error_message,
        created_at: data.created_at,
        updated_at: data.updated_at,
        completed_at: data.completed_at
      };
    },
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: false,
  });
};

export const useMarketingImageGeneration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  const startJobMutation = useStartMarketingImageJob();
  const { data: jobStatus, error: statusError } = useMarketingImageJobStatus(currentJobId);

  // Stop polling when job is complete
  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      // Optional: Could add logic here to stop polling, but the query will handle it
    }
  }, [jobStatus?.status]);

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === 'completed') {
      toast.success('Marketing image generated successfully! 5 credits used.');
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
    } else if (jobStatus?.status === 'failed') {
      toast.error(jobStatus.error_message || 'Image generation failed');
    }
  }, [jobStatus?.status, queryClient]);

  const generateMarketingImage = async (params: GenerateMarketingImageParams) => {
    try {
      const { job_id } = await startJobMutation.mutateAsync(params);
      setCurrentJobId(job_id);
      return { job_id, status: 'processing' };
    } catch (error) {
      setCurrentJobId(null);
      throw error;
    }
  };

  return {
    generateMarketingImage,
    isGenerating: startJobMutation.isPending || (jobStatus?.status === 'processing' || jobStatus?.status === 'pending'),
    jobStatus,
    error: startJobMutation.error || statusError,
    currentJobId
  };
};