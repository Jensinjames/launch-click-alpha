import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Download, Save, Clock } from 'lucide-react';
import { useMarketingImageGeneration } from '@/hooks/useMarketingImageGeneration';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useGenerateContext } from '@/contexts/GenerateContext';
import type { GeneratedImage } from '@/types/generate';
import { toast } from 'sonner';

interface MarketingImageResult {
  image_url: string;
  filename: string;
  prompt: string;
}

interface JobResult {
  job_id: string;
  status: string;
}

export const MarketingImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [numSteps, setNumSteps] = useState(50);
  const [generatedImage, setGeneratedImage] = useState<MarketingImageResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const { generateMarketingImage, isGenerating, jobStatus, currentJobId } = useMarketingImageGeneration();
  const { hasCreditsRemaining } = useUserPlan();
  const { generatedImages, setGeneratedImages, saveImageToStorage, setActiveTab } = useGenerateContext();

  // Handle job status updates
  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.image_url) {
      const newImage = {
        image_url: jobStatus.image_url,
        filename: `marketing_${currentJobId}.png`,
        prompt: jobStatus.prompt
      };
      
      setGeneratedImage(newImage);
      setProgress(100);
      setEstimatedTime(0);

      // Auto-add to session images
      const sessionImage: GeneratedImage = {
        id: `session-${Date.now()}`,
        imageUrl: jobStatus.image_url,
        name: `Marketing Image ${new Date().toLocaleDateString()}`,
        prompt: jobStatus.prompt,
        type: 'marketing',
        style: style,
        created_at: new Date().toISOString()
      };
      
      setGeneratedImages([...generatedImages, sessionImage]);
      
      // Save to persistent storage
      saveImageToStorage(sessionImage);
      
    } else if (jobStatus?.status === 'failed') {
      setProgress(0);
      setEstimatedTime(0);
    } else if (jobStatus?.status === 'processing') {
      // Simulate progress for processing jobs
      if (progress < 95) {
        setProgress(prev => Math.min(prev + 1, 95));
        setEstimatedTime(Math.max(0, 45 - (progress / 2)));
      }
    }
  }, [jobStatus, currentJobId, progress, generatedImages, setGeneratedImages, saveImageToStorage, style]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      // Reset states
      setGeneratedImage(null);
      setProgress(5);
      setEstimatedTime(45);

      await generateMarketingImage({
        prompt,
        style,
        num_steps: numSteps
      });

      // Progress will be updated by the effect above based on job status
    } catch (error) {
      console.error('Failed to generate marketing image:', error);
      setProgress(0);
      setEstimatedTime(0);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      // Create a proper download for base64 images  
      const link = document.createElement('a');
      link.href = generatedImage.image_url;
      link.download = generatedImage.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    }
  };

  const handleSaveToContent = async () => {
    if (generatedImage) {
      // Switch to results tab to show the saved content
      setActiveTab("results");
      toast.success('Marketing image saved to your content library!');
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
        {/* Loading Progress */}
        {isGenerating && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Generating marketing image...</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" />
                ~{estimatedTime}s remaining
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              High-quality images take 30-60 seconds to generate. Please wait...
            </p>
          </div>
        )}

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
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {generatedImage.prompt}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveToContent}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save to Content
                  </Button>
                </div>
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
              <span>Cost: 5 credits per marketing image</span>
              {isGenerating && (
                <span className="block text-xs mt-1">
                  Generation takes 30-60 seconds
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || !hasCreditsRemaining()}
              className="flex items-center gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating ({Math.round(progress)}%)
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