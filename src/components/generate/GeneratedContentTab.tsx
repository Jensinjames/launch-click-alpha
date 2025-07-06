import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useGenerateContext } from "@/contexts/GenerateContext";

export const GeneratedContentTab = () => {
  const {
    generatedContent,
    generatedImages,
    setGeneratedContent,
    setGeneratedImages,
    setPrompt,
    setTitle,
    setSelectedTemplate
  } = useGenerateContext();

  const hasContent = generatedContent || generatedImages.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Content Generated Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Generate some content or visual assets from the other tabs to see your results here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Generated Content & Assets</h2>
        <p className="text-muted-foreground">
          Your AI-generated content and images are ready! You can copy, download, or make edits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Generated Content & Assets
          </CardTitle>
          <CardDescription>
            Your AI-generated content and images are ready! You can copy, download, or make edits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Content */}
          {generatedContent && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Text Content</h4>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">{generatedContent.title}</h3>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {generatedContent.content?.text || 'No content generated'}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(generatedContent.content?.text || '')}
              >
                Copy Text to Clipboard
              </Button>
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Generated Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <h5 className="font-medium text-sm">{image.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {image.prompt}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(image.imageUrl, '_blank')}
                      >
                        Download Image
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => {
                setGeneratedContent(null);
                setGeneratedImages([]);
                setPrompt('');
                setTitle('');
                setSelectedTemplate(null);
              }}
            >
              Generate New Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};