import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Download } from 'lucide-react';
import { useMarketingImageGeneration } from '@/hooks/useMarketingImageGeneration';
import { useUserPlan } from '@/hooks/useUserPlan';

interface MarketingImageResult {
  image_url: string;
  filename: string;
  prompt: string;
}

export const MarketingImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [numSteps, setNumSteps] = useState(50);
  const [generatedImage, setGeneratedImage] = useState<MarketingImageResult | null>(null);

  const { generateMarketingImage, isGenerating } = useMarketingImageGeneration();
  const { hasCreditsRemaining } = useUserPlan();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const result = await generateMarketingImage({
        prompt,
        style,
        num_steps: numSteps
      });

      setGeneratedImage({
        image_url: result.image_url,
        filename: result.filename,
        prompt: prompt
      });
    } catch (error) {
      console.error('Failed to generate marketing image:', error);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      window.open(generatedImage.image_url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Marketing Image Generator
        </CardTitle>
        <CardDescription>
          Generate AI-powered marketing images using HuggingFace's specialized models
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Generated Image Display */}
        {generatedImage && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Generated Marketing Image:</h4>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={generatedImage.image_url}
                alt="Generated marketing image"
                className="w-full h-64 object-cover"
              />
              <div className="p-3">
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {generatedImage.prompt}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generation Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketing-prompt">Image Description</Label>
            <Textarea
              id="marketing-prompt"
              placeholder="Describe the marketing image you want to generate (e.g., professional product showcase, social media banner, advertisement graphic)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality Steps</Label>
              <Select value={numSteps.toString()} onValueChange={(value) => setNumSteps(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">Fast (25 steps)</SelectItem>
                  <SelectItem value="50">Balanced (50 steps)</SelectItem>
                  <SelectItem value="75">High Quality (75 steps)</SelectItem>
                  <SelectItem value="100">Maximum (100 steps)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Cost: 5 credits per marketing image
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || !hasCreditsRemaining()}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Marketing Image (5 credits)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};