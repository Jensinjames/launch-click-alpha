import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { usePipelineRequirements } from '@/hooks/usePipelineRequirements';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useUserPlan } from '@/hooks/useUserPlan';
import type { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];

interface ImageGenerationPanelProps {
  contentType: ContentType;
  contentPrompt: string;
}

interface GeneratedImageResult {
  name: string;
  type: string;
  imageUrl: string;
  prompt: string;
}

export const ImageGenerationPanel = ({ contentType, contentPrompt }: ImageGenerationPanelProps) => {
  const [selectedImageType, setSelectedImageType] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageStyle, setImageStyle] = useState<'natural' | 'vivid'>('natural');
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[]>([]);

  const { data: pipelineReqs, isLoading: loadingReqs } = usePipelineRequirements(contentType);
  const { generateImage, isGenerating } = useImageGeneration();
  const { hasCreditsRemaining } = useUserPlan();

  const handleGenerateImage = async () => {
    if (!selectedImageType || !imagePrompt.trim()) return;

    const selectedImage = pipelineReqs?.requiredImages.find(img => img.type === selectedImageType);
    if (!selectedImage) return;

    try {
      const result = await generateImage({
        prompt: imagePrompt,
        style: imageStyle,
        size: imageSize,
        imageType: selectedImageType
      });

      const newImage: GeneratedImageResult = {
        name: selectedImage.name,
        type: selectedImageType,
        imageUrl: result.image_url,
        prompt: imagePrompt
      };

      setGeneratedImages(prev => [...prev.filter(img => img.type !== selectedImageType), newImage]);
      setImagePrompt('');
      setSelectedImageType('');
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  };

  const suggestPrompt = (imageName: string, imageDescription: string) => {
    const basePrompt = `${imageName.toLowerCase()} for ${contentPrompt.slice(0, 100)}...`;
    setImagePrompt(`Create a professional ${basePrompt}. ${imageDescription}. High quality, modern design.`);
  };

  if (loadingReqs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading image requirements...</span>
        </CardContent>
      </Card>
    );
  }

  if (!pipelineReqs || !pipelineReqs.requiredImages.length) {
    return null;
  }

  const availableImages = pipelineReqs.requiredImages.filter(img => 
    !generatedImages.some(gen => gen.type === img.type)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          {pipelineReqs.name} - Visual Assets
        </CardTitle>
        <CardDescription>
          {pipelineReqs.description}. Generate the required images for your content package.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Generated Images Display */}
        {generatedImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Generated Images:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((img, index) => (
                <div key={index} className="relative border rounded-lg overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={img.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{img.name}</span>
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {img.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Requirements Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Required Images:</h4>
          <div className="space-y-2">
            {pipelineReqs.requiredImages.map((image, index) => {
              const isGenerated = generatedImages.some(gen => gen.type === image.type);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isGenerated ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{image.name}</span>
                      {image.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      {isGenerated && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{image.description}</p>
                  </div>
                  {!isGenerated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImageType(image.type);
                        suggestPrompt(image.name, image.description);
                      }}
                    >
                      Generate
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Image Generation Form */}
        {selectedImageType && availableImages.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">
                Generate: {pipelineReqs.requiredImages.find(img => img.type === selectedImageType)?.name}
              </h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-prompt">Image Description</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="Describe the image you want to generate..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={imageStyle} onValueChange={(value: 'natural' | 'vivid') => setImageStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="vivid">Vivid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={imageSize} onValueChange={(value: '1024x1024' | '1792x1024' | '1024x1792') => setImageSize(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                      <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                      <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Cost: 5 credits per image
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImageType('');
                      setImagePrompt('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGenerating || !hasCreditsRemaining()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Image (5 credits)'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {pipelineReqs.requiredImages.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">
              Progress: {generatedImages.length} / {pipelineReqs.requiredImages.length} images
            </span>
            {generatedImages.length === pipelineReqs.requiredImages.length && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};