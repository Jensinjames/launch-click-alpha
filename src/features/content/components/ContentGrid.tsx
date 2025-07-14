// Content Grid Component - Main Content Display
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { MultiSelectContent } from "./MultiSelectContent";
import type { ContentItem, CategoryInfo } from "../types";

interface ContentGridProps {
  contentItems: ContentItem[];
  isLoading: boolean;
  error: unknown;
  categoryInfo: CategoryInfo;
  onToggleFavorite: (id: string, currentFavorite: boolean) => void;
  onDeleteContent: (id: string, title: string) => void;
  onCopyContent: (content: ContentItem['content']) => void;
  onNavigateToGenerate: () => void;
}

export const ContentGrid = ({
  contentItems,
  isLoading,
  error,
  categoryInfo,
  onToggleFavorite,
  onDeleteContent,
  onCopyContent,
  onNavigateToGenerate,
}: ContentGridProps) => {
  if (isLoading) {
    return (
      <section aria-labelledby="content-grid-heading">
        <h2 id="content-grid-heading" className="sr-only">
          Your generated content
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-16 bg-muted rounded mb-4" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby="content-grid-heading">
        <h2 id="content-grid-heading" className="sr-only">
          Your generated content
        </h2>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error loading content
            </h3>
            <p className="text-muted-foreground mb-6">
              {String(error)}
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (contentItems.length === 0) {
    return (
      <section aria-labelledby="content-grid-heading">
        <h2 id="content-grid-heading" className="sr-only">
          Your generated content
        </h2>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No content found
            </h3>
            <p className="text-muted-foreground mb-6">
              Get started by generating your first piece of content.
            </p>
            <Button onClick={onNavigateToGenerate}>
              {categoryInfo.cta}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="content-grid-heading">
      <h2 id="content-grid-heading" className="sr-only">
        Your generated content
      </h2>
      <MultiSelectContent 
        contentItems={contentItems}
        onToggleFavorite={onToggleFavorite}
        onDeleteContent={onDeleteContent}
        onCopyContent={onCopyContent}
      />
    </section>
  );
};