import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Layers, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Users
} from 'lucide-react';
import { useContentAssemblies, useDeleteAssembly } from '@/hooks/useContentAssembly';
import { AssemblyViewer } from './AssemblyViewer';
import { EditAssemblyDialog } from './EditAssemblyDialog';
import type { ContentAssembly } from '@/types/assembly';

export const AssemblyGrid = () => {
  const [selectedAssembly, setSelectedAssembly] = useState<ContentAssembly | null>(null);
  const [editingAssembly, setEditingAssembly] = useState<ContentAssembly | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: assemblies, isLoading } = useContentAssemblies();
  const deleteAssembly = useDeleteAssembly();

  const handleView = (assembly: ContentAssembly) => {
    setSelectedAssembly(assembly);
    setViewerOpen(true);
  };

  const handleEdit = (assembly: ContentAssembly) => {
    setEditingAssembly(assembly);
    setEditDialogOpen(true);
  };

  const handleDelete = async (assembly: ContentAssembly) => {
    if (window.confirm(`Are you sure you want to delete "${assembly.title}"?`)) {
      await deleteAssembly.mutateAsync(assembly.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template':
        return '📝';
      case 'automated':
        return '🤖';
      default:
        return '👤';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!assemblies || assemblies.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Content Assemblies</h3>
          <p className="text-muted-foreground mb-4">
            Create your first assembly to combine multiple content pieces into cohesive campaigns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assemblies.map((assembly) => (
          <Card key={assembly.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2 mb-1">
                    <span className="text-lg">{getTypeIcon(assembly.assembly_type)}</span>
                    <span className="truncate">{assembly.title}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(assembly.status)}>
                      {assembly.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {assembly.assembly_type}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(assembly)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(assembly)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(assembly)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {assembly.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {assembly.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(assembly.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleView(assembly)}
                  className="h-8 px-2 text-xs"
                >
                  View Assembly
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assembly Viewer */}
      <AssemblyViewer
        assembly={selectedAssembly}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      {/* Edit Dialog */}
      <EditAssemblyDialog
        assembly={editingAssembly}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
};