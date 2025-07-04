import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Clock, Eye, Info } from "lucide-react";
import { useTemplates, useUseTemplate } from "@/hooks/templates/useTemplates";
import { TemplatePreview } from "./TemplatePreview";
import type { Database } from '@/integrations/supabase/types';

type ContentTemplate = Database['public']['Tables']['content_templates']['Row'];
type ContentType = Database['public']['Enums']['content_type'];

interface TemplateSelectorProps {
  contentType: ContentType;
  onTemplateSelect: (template: ContentTemplate) => void;
  children: React.ReactNode;
}

export const TemplateSelector = ({ contentType, onTemplateSelect, children }: TemplateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: templates, isLoading } = useTemplates(contentType);
  const useTemplateMutation = useUseTemplate();

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleTemplateSelect = async (template: ContentTemplate) => {
    try {
      await useTemplateMutation.mutateAsync(template.id);
      onTemplateSelect(template);
      setOpen(false);
      setPreviewOpen(false);
    } catch (error) {
      console.error('Failed to use template:', error);
      // Error is already handled by the mutation's onError
    }
  };

  const handlePreviewTemplate = (template: ContentTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Choose a Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-made template to speed up your content creation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "No templates available for this content type yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      {template.is_public && (
                        <Badge variant="secondary" className="ml-2">
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {template.usage_count || 0} uses
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                          className="flex-1"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                          disabled={useTemplateMutation.isPending}
                          className="flex-1"
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      
      <TemplatePreview
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={handleTemplateSelect}
        isLoading={useTemplateMutation.isPending}
      />
    </Dialog>
  );
};