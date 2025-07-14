// Multi-Select Content Component - Type-safe version
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Heart, 
  Calendar, 
  Copy, 
  Trash2, 
  FileText, 
  Mail, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';
import { ContentOperationsService } from '../services/ContentOperationsService';
import { ExportButton } from './ExportButton';
import { BulkExportButton } from './BulkExportButton';
import type { ContentItem } from '../types';

interface MultiSelectContentProps {
  contentItems: ContentItem[];
  onToggleFavorite: (id: string, currentFavorite: boolean) => void;
  onDeleteContent: (id: string, title: string) => void;
  onCopyContent: (content: ContentItem['content']) => void;
}

export const MultiSelectContent = ({
  contentItems,
  onToggleFavorite,
  onDeleteContent,
  onCopyContent
}: MultiSelectContentProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleToggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    // Exit selection mode if no items are selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === contentItems.length) {
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedItems(new Set(contentItems.map(item => item.id)));
      setIsSelectionMode(true);
    }
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(id => {
      const item = contentItems.find(item => item.id === id);
      if (item) {
        onDeleteContent(id, item.title);
      }
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const selectedItemsArray = Array.from(selectedItems);

  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {(isSelectionMode || selectedItems.size > 0) && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === contentItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedItems.size > 0 
                      ? `${selectedItems.size} selected`
                      : 'Select all'
                    }
                  </span>
                </div>
                
                {selectedItems.size > 0 && (
                  <div className="flex items-center gap-2">
                    <BulkExportButton 
                      selectedContentIds={selectedItemsArray}
                      onExportComplete={exitSelectionMode}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedItems.size})
                    </Button>
                  </div>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={exitSelectionMode}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contentItems.map(item => {
          const iconName = ContentOperationsService.getTypeIcon(item.type);
          const IconComponent = iconName === 'Mail' ? Mail : 
                               iconName === 'Share2' ? Share2 : 
                               iconName === 'MoreHorizontal' ? MoreHorizontal : FileText;
          
          // Type-safe content text extraction
          const contentText = (() => {
            if (typeof item.content === 'string') return item.content;
            if (item.content && typeof item.content === 'object') {
              if ('text' in item.content && typeof item.content.text === 'string') {
                return item.content.text;
              }
              return JSON.stringify(item.content, null, 2);
            }
            return 'No content available';
          })();
          
          const isSelected = selectedItems.has(item.id);
          
          return (
            <Card 
              key={item.id} 
              className={`hover:shadow-lg transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Selection Checkbox */}
                    {(isSelectionMode || isSelected) && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelection(item.id)}
                      />
                    )}
                    
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate text-foreground text-sm">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ContentOperationsService.getTypeLabel(item.type)}
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
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onToggleFavorite(item.id, item.is_favorite || false)}
                      className={item.is_favorite ? 'text-red-500' : 'text-muted-foreground'}
                    >
                      <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                    </Button>
                    
                    {!isSelectionMode && !isSelected && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsSelectionMode(true);
                          handleToggleSelection(item.id);
                        }}
                      >
                        <Checkbox />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-3 text-muted-foreground">
                  {contentText.substring(0, 150)}...
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
                  
                  <ExportButton 
                    contentId={item.id}
                    contentTitle={item.title}
                    size="sm"
                  />
                  
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
        })}
      </div>
    </div>
  );
};