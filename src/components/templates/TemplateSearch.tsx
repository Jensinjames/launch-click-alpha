import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Download, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  output_format: string;
  rating: number;
  download_count: number;
  review_count: number;
  complexity_level: string;
  is_featured: boolean;
  tags: string[];
  creator_name: string;
}

export const TemplateSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: [],
    output_format: [],
    complexity_level: []
  });

  const searchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-templates', {
        body: {
          query,
          ...filters,
          sort_by: 'rating',
          sort_order: 'desc',
          limit: 20
        }
      });

      if (error) throw error;
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      // Navigate to content generation with selected template
      console.log('Using template:', templateId);
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchTemplates()}
          />
        </div>
        <Button onClick={searchTemplates} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                {template.is_featured && (
                  <Badge variant="secondary" className="ml-2">Featured</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {template.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{template.rating?.toFixed(1) || '0.0'}</span>
                  <span>({template.review_count || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{template.download_count || 0}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{template.type.replace('_', ' ')}</Badge>
                <Badge variant="outline">{template.output_format}</Badge>
                <Badge variant="outline">{template.complexity_level}</Badge>
              </div>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>by {template.creator_name}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => useTemplate(template.id)}
                  className="group-hover:shadow-md transition-shadow"
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No templates found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};