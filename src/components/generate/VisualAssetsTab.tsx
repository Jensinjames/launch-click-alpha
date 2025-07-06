import { ImageGenerationPanel } from "@/components/image-generation/ImageGenerationPanel";
import { MarketingImageGenerator } from "@/components/image-generation/MarketingImageGenerator";
import { useGenerateContext } from "@/contexts/GenerateContext";
import type { Database } from '@/integrations/supabase/types';

// Map frontend content type IDs to database enum values
const contentTypeMapping: Record<string, Database['public']['Enums']['content_type']> = {
  email: 'email_sequence',
  social: 'social_post',
  landing: 'landing_page',
  blog: 'blog_post',
  ad: 'ad_copy',
  funnel: 'funnel'
};

export const VisualAssetsTab = () => {
  const { selectedType, prompt } = useGenerateContext();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Visual Assets Generator</h2>
        <p className="text-muted-foreground">
          Create stunning images and visual content to complement your marketing materials
        </p>
      </div>

      <div className="space-y-6">
        {/* Pipeline-based Image Generation */}
        {selectedType && (
          <ImageGenerationPanel 
            contentType={contentTypeMapping[selectedType]}
            contentPrompt={prompt}
          />
        )}
        
        {/* Marketing Image Generator */}
        <MarketingImageGenerator />
      </div>
    </div>
  );
};