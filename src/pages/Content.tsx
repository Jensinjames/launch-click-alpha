import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Copy, Eye, Calendar, FileText, Mail, Share2, MoreHorizontal } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
const Content = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Mock content data
  const contentItems = [{
    id: 1,
    title: "Summer Sale Email Campaign",
    type: "email",
    content: "Get ready for our biggest sale of the year! Summer savings up to 70% off...",
    createdAt: "2024-06-20",
    status: "published",
    views: 1245,
    icon: Mail
  }, {
    id: 2,
    title: "Product Launch Social Media Post",
    type: "social",
    content: "🚀 Introducing our game-changing new product that will revolutionize...",
    createdAt: "2024-06-19",
    status: "draft",
    views: 0,
    icon: Share2
  }, {
    id: 3,
    title: "Landing Page Hero Copy",
    type: "landing",
    content: "Transform Your Business with AI-Powered Solutions. Discover how...",
    createdAt: "2024-06-18",
    status: "published",
    views: 856,
    icon: FileText
  }];
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
      case 'email':
        return 'Email Campaign';
      case 'social':
        return 'Social Media';
      case 'landing':
        return 'Landing Page';
      case 'blog':
        return 'Blog Post';
      case 'ad':
        return 'Ad Copy';
      default:
        return type;
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
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="ad">Ad Copy</SelectItem>
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
                          <SelectItem value="views">Most Views</SelectItem>
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
            {contentItems.length === 0 ? <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No content found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by generating your first piece of content.
                  </p>
                  <Button>
                    Generate Content
                  </Button>
                </CardContent>
              </Card> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-none py-0 my-0 mx-0 px-0">
                {contentItems.map(item => {
              const Icon = item.icon;
              return <Card key={item.id} tabIndex={0} role="article" aria-labelledby={`content-title-${item.id}`} className="hover:shadow-lg transition-shadow duration-200 my-[2px] py-0 px-0 mx-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Icon className="h-5 w-5 text-purple-600" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 id={`content-title-${item.id}`} className="font-semibold truncate text-foreground text-sm my-0 py-0 px-0 mx-0">
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(item.type)}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" aria-label={`More options for ${item.title}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4 line-clamp-3 text-muted-foreground">
                          {item.content}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center text-base text-muted-foreground">
                              <Calendar className="mr-1 h-4 w-4" aria-hidden="true" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                              {item.views} views
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" aria-label={`View ${item.title}`}>
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" aria-label={`Copy ${item.title}`}>
                            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" aria-label={`Download ${item.title}`}>
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>;
            })}
              </div>}
          </section>
        </div>
      </Layout>
    </AuthGuard>;
};
export default Content;