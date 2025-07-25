import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Download, Heart, Trash2, Loader2 } from "lucide-react";
import { useGenerateContext } from "@/contexts/GenerateContext";
import { useUserImages } from "@/hooks/useUserImages";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

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

  const { data: userImages = [], isLoading: imagesLoading, error: imagesError } = useUserImages(10);
  
  const hasCurrentContent = generatedContent || generatedImages.length > 0;
  const hasStoredImages = userImages.length > 0;
  const hasAnyContent = hasCurrentContent || hasStoredImages;

  if (imagesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
        <h3 className="text-lg font-medium mb-2">Loading Your Content...</h3>
        <p className="text-muted-foreground max-w-md">
          Fetching your generated content and images.
        </p>
      </div>
    );
  }

  if (!hasAnyContent) {
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
                  {generatedContent.content || generatedContent.text || 'No content generated'}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(generatedContent.content || generatedContent.text || '')}
              >
                Copy Text to Clipboard
              </Button>
            </div>
          )}

          {/* Current Session Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                Current Session Images
                <Badge variant="secondary">{generatedImages.length}</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden bg-card">
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="p-3">
                      <h5 className="font-medium text-sm">{image.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {image.prompt}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(image.imageUrl, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery from Database */}
          {hasStoredImages && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                Your Image Library
                <Badge variant="secondary">{userImages.length}</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userImages.map((image) => (
                  <div key={image.id} className="border rounded-lg overflow-hidden bg-card">
                    <div className="relative">
                      <img
                        src={image.imageUrl}
                        alt={image.name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <Badge 
                        variant={image.type === 'marketing' ? 'default' : 'secondary'}
                        className="absolute top-2 right-2"
                      >
                        {image.type}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h5 className="font-medium text-sm truncate">{image.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {image.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                      </p>
                      {image.width && image.height && (
                        <p className="text-xs text-muted-foreground">
                          {image.width} × {image.height}
                          {image.file_size && ` • ${(image.file_size / 1024).toFixed(0)}KB`}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(image.imageUrl, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imagesError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Failed to load your image library. Please try refreshing the page.
              </p>
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