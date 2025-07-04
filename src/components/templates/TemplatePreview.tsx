import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Clock, User, Tag } from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type ContentTemplate = Database['public']['Tables']['content_templates']['Row'];

interface TemplatePreviewProps {
  template: ContentTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: ContentTemplate) => void;
  isLoading?: boolean;
}

export const TemplatePreview = ({ 
  template, 
  open, 
  onOpenChange, 
  onUseTemplate, 
  isLoading = false 
}: TemplatePreviewProps) => {
  if (!template) return null;

  const templateData = template.template_data as any;
  const hasFields = templateData?.fields && Array.isArray(templateData.fields);
  const hasPrompts = templateData?.prompts && Array.isArray(templateData.prompts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Template Preview
          </DialogTitle>
          <DialogDescription>
            Review this template before using it in your content generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{template.name}</h3>
              {template.is_public && (
                <Badge variant="secondary">Public</Badge>
              )}
            </div>
            
            {template.description && (
              <p className="text-muted-foreground">{template.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {template.usage_count || 0} uses
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(template.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {template.complexity_level || 'Simple'}
              </div>
            </div>

            {template.tags && template.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Template Structure */}
          <div className="space-y-4">
            <h4 className="font-semibold">Template Structure</h4>
            
            {hasFields && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Input Fields:</h5>
                <div className="grid gap-2">
                  {templateData.fields.map((field: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{field.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                      </div>
                      {field.required && (
                        <span className="text-xs text-destructive">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasPrompts && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Generation Prompts:</h5>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{templateData.prompts[0]?.input || 'Custom prompt template'}</p>
                </div>
              </div>
            )}

            {templateData?.prompt && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Template Prompt:</h5>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{templateData.prompt}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onUseTemplate(template)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Using Template...' : 'Use This Template'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};