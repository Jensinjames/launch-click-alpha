import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];
type PipelineInfo = Database['public']['Tables']['content_pipeline_requirements']['Row'];

interface ImageRequirement {
  name: string;
  description: string;
  type: string;
  required: boolean;
}

interface PipelineRequirements {
  id: string;
  contentType: ContentType;
  name: string;
  description: string;
  requiredImages: ImageRequirement[];
}

export const usePipelineRequirements = (contentType: ContentType | null) => {
  return useQuery({
    queryKey: ['pipeline-requirements', contentType],
    queryFn: async (): Promise<PipelineRequirements | null> => {
      if (!contentType) return null;

      const { data, error } = await supabase
        .from('content_pipeline_requirements')
        .select('*')
        .eq('content_type', contentType)
        .maybeSingle();

      if (error) {
        console.error('Error fetching pipeline requirements:', error);
        throw new Error('Failed to fetch pipeline requirements');
      }

      if (!data) return null;

      const pipelineConfig = data.pipeline_config as any;
      const requiredImages = (data.required_images as unknown) as ImageRequirement[];

      return {
        id: data.id,
        contentType: data.content_type,
        name: pipelineConfig?.name || 'Content Package',
        description: pipelineConfig?.description || 'Visual assets for your content',
        requiredImages: requiredImages || []
      };
    },
    enabled: !!contentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};