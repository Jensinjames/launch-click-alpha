import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  GripVertical, 
  FileText, 
  Calendar,
  Type,
  X,
  Plus,
  Edit
} from 'lucide-react';
import { useAssemblyWithContent, useUpdateContentOrder, useRemoveContentFromAssembly } from '@/hooks/useContentAssembly';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AddContentToAssemblyDialog } from './AddContentToAssemblyDialog';
import type { ContentAssembly } from '@/types/assembly';

interface AssemblyViewerProps {
  assembly: ContentAssembly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssemblyViewer = ({ assembly, open, onOpenChange }: AssemblyViewerProps) => {
  const [showAddContent, setShowAddContent] = useState(false);
  
  const { data: assemblyData, isLoading } = useAssemblyWithContent(assembly?.id || null);
  const updateContentOrder = useUpdateContentOrder();
  const removeContent = useRemoveContentFromAssembly();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !assemblyData) return;

    const items = Array.from(assemblyData.content);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const contentUpdates = items.map((item, index) => ({
      dependencyId: item.dependency_id,
      newOrder: index
    }));

    await updateContentOrder.mutateAsync({
      assemblyId: assembly!.id,
      contentUpdates
    });
  };

  const getContentTypeColor = (type: string) => {
    const colors = {
      'email_sequence': 'bg-blue-100 text-blue-800 border-blue-200',
      'social_post': 'bg-green-100 text-green-800 border-green-200',
      'landing_page': 'bg-purple-100 text-purple-800 border-purple-200',
      'blog_post': 'bg-orange-100 text-orange-800 border-orange-200',
      'ad_copy': 'bg-red-100 text-red-800 border-red-200',
      'funnel': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'strategy_brief': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getContentPreview = (content: any) => {
    if (typeof content === 'string') {
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }
    if (typeof content === 'object' && content !== null) {
      // Handle different content structures
      if (content.text) return content.text.substring(0, 150) + '...';
      if (content.body) return content.body.substring(0, 150) + '...';
      if (content.content) return content.content.substring(0, 150) + '...';
      return JSON.stringify(content).substring(0, 150) + '...';
    }
    return 'No preview available';
  };

  if (!assembly) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {assembly.title}
              <Badge variant="outline" className="ml-2">
                {assembly.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assembly Info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{assembly.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{assembly.assembly_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Updated {new Date(assembly.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddContent(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </CardHeader>
              {assembly.description && (
                <CardContent className="pt-0">
                  <p className="text-muted-foreground">{assembly.description}</p>
                </CardContent>
              )}
            </Card>

            {/* Content List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assembly Content</h3>
                {assemblyData?.content && (
                  <span className="text-sm text-muted-foreground">
                    {assemblyData.content.length} item{assemblyData.content.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                            <div className="h-3 bg-muted rounded"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : assemblyData?.content && assemblyData.content.length > 0 ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="assembly-content">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {assemblyData.content.map((item, index) => (
                            <Draggable 
                              key={item.dependency_id} 
                              draggableId={item.dependency_id} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="mt-1 text-muted-foreground cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <h4 className="font-medium truncate">{item.content.title}</h4>
                                          <Badge 
                                            variant="outline" 
                                            className={getContentTypeColor(item.content.type)}
                                          >
                                            {item.content.type.replace('_', ' ')}
                                          </Badge>
                                        </div>
                                        
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {getContentPreview(item.content.content)}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                              {new Date(item.content.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Type className="h-3 w-3" />
                                            <span>{item.dependency_type}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeContent.mutateAsync(item.dependency_id)}
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-4">No content in this assembly yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddContent(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Content
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddContentToAssemblyDialog
        assembly={assembly}
        open={showAddContent}
        onOpenChange={setShowAddContent}
      />
    </>
  );
};