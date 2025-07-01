import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Copy, Eye, Calendar, FileText, Mail, Share2, MoreHorizontal, Heart, Trash2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useUserContent } from "@/hooks/useUserContent";
import { useContentMutations } from "@/hooks/useContentMutations";
import { toast } from "sonner";
const Content = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: contentItems = [], isLoading, error } = useUserContent({
    type: filterType,
    search: searchQuery,
    sortBy: sortBy as any
  });

  const { toggleFavorite, deleteContent } = useContentMutations();

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      await toggleFavorite.mutateAsync({ id, is_favorite: !currentFavorite });
      toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleDeleteContent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await deleteContent.mutateAsync(id);
      toast.success('Content deleted successfully');
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleCopyContent = async (content: any) => {
    try {
      const textToCopy = content?.text || JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email_sequence':
        return 'Email Campaign';
      case 'social_post':
        return 'Social Media';
      case 'landing_page':
        return 'Landing Page';
      case 'blog_post':
        return 'Blog Post';
      case 'ad_copy':
        return 'Ad Copy';
      case 'funnel':
        return 'Sales Funnel';
      case 'strategy_brief':
        return 'Strategy Brief';
      default:
        return type.replace('_', ' ');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email_sequence':
        return Mail;
      case 'social_post':
        return Share2;
      case 'landing_page':
      case 'blog_post':
      case 'strategy_brief':
        return FileText;
      case 'ad_copy':
        return MoreHorizontal;
      case 'funnel':
        return FileText;
      default:
        return FileText;
    }
  };
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-foreground">
              Content Library
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage and organize all your generated content
            </p>
          </header>

          {/* Filters and Search */}
          <section aria-labelledby="filters-heading" className="mb-8">
            <h2 id="filters-heading" className="sr-only">
              Filter and search content
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="content-search" className="sr-only">
                      Search content
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                      <Input id="content-search" placeholder="Search content..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <Label htmlFor="content-type-filter" className="sr-only">
                        Filter by content type
                      </Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger id="content-type-filter" className="w-40">
                          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                          <SelectValue />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="email_sequence">Email Campaign</SelectItem>
                            <SelectItem value="social_post">Social Media</SelectItem>
                            <SelectItem value="landing_page">Landing Page</SelectItem>
                            <SelectItem value="blog_post">Blog Post</SelectItem>
                            <SelectItem value="ad_copy">Ad Copy</SelectItem>
                            <SelectItem value="funnel">Sales Funnel</SelectItem>
                            <SelectItem value="strategy_brief">Strategy Brief</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content-sort" className="sr-only">
                        Sort content
                      </Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger id="content-sort" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="favorites">Favorites</SelectItem>
                            <SelectItem value="title">Title A-Z</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Content Grid */}
          <section aria-labelledby="content-grid-heading">
            <h2 id="content-grid-heading" className="sr-only">
              Your generated content
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-muted rounded mb-4" />
                      <div className="h-8 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
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
            ) : contentItems.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery || filterType !== 'all' ? 'No content matches your filters' : 'No content found'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by generating your first piece of content.'}
                  </p>
                  <Button onClick={() => window.location.href = '/generate'}>
                    Generate Content
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contentItems.map(item => {
                  const Icon = getTypeIcon(item.type);
                  const contentText = (item.content as any)?.text || JSON.stringify(item.content, null, 2) || 'No content available';
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Icon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate text-foreground text-sm">
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(item.type)}
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
                            onClick={() => handleToggleFavorite(item.id, item.is_favorite || false)}
                            className={item.is_favorite ? 'text-red-500' : 'text-muted-foreground'}
                          >
                            <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                          </Button>
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
                            {(item.metadata as any)?.creditsCost && (
                              <span className="flex items-center">
                                <span className="mr-1">💳</span>
                                {(item.metadata as any).creditsCost} credits
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleCopyContent(item.content)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteContent(item.id, item.title)}
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
            )}
          </section>
        </div>
      </Layout>
    </AuthGuard>;
};
export default Content;