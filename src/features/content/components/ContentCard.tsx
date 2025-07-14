// Content Card Component - Individual Content Display
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Copy, Trash2, FileText, Mail, Share2 } from "lucide-react";
import type { ContentItem } from "../types";

interface ContentCardProps {
  item: ContentItem;
  onToggleFavorite: (id: string, currentFavorite: boolean) => void;
  onDeleteContent: (id: string, title: string) => void;
  onCopyContent: (content: ContentItem['content']) => void;
}

export const ContentCard = ({
  item,
  onToggleFavorite,
  onDeleteContent,
  onCopyContent
}: ContentCardProps) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'email_sequence':
        return <Mail className="h-5 w-5 text-purple-600" />;
      case 'social_post':
        return <Share2 className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-purple-600" />;
    }
  };

  const getContentText = () => {
    if (typeof item.content === 'string') return item.content;
    if (item.content && typeof item.content === 'object') {
      if ('text' in item.content && typeof item.content.text === 'string') {
        return item.content.text;
      }
      return JSON.stringify(item.content, null, 2);
    }
    return 'No content available';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-2 bg-purple-100 rounded-lg">
              {getTypeIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate text-foreground text-sm">
                {item.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.type.replace('_', ' ')}
                </Badge>
                {item.is_favorite && (
                  <Badge variant="secondary" className="text-xs">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Favorite
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onToggleFavorite(item.id, item.is_favorite)}
            className={item.is_favorite ? 'text-red-500' : 'text-muted-foreground'}
          >
            <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4 line-clamp-3 text-muted-foreground">
          {getContentText().substring(0, 150)}...
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.metadata?.creditsCost && (
              <span className="flex items-center">
                <span className="mr-1">💳</span>
                {item.metadata.creditsCost} credits
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onCopyContent(item.content)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDeleteContent(item.id, item.title)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};