// Content Filters Component - Search and Filter UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Layers, X } from "lucide-react";
import { CreateAssemblyDialog } from "@/components/assembly";
import type { ContentType, ContentTypeWithAll, ContentFilters as ContentFiltersType } from "../types";

interface ContentFiltersProps {
  searchQuery: string;
  filterType: ContentTypeWithAll;
  sortBy: ContentFiltersType['sortBy'];
  onSearchChange: (value: string) => void;
  onFilterChange: (type: ContentTypeWithAll) => void;
  onSortChange: (sortBy: ContentFiltersType['sortBy']) => void;
  onClearFilters: () => void;
}

export const ContentFilters = ({
  searchQuery,
  filterType,
  sortBy,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: ContentFiltersProps) => {
  const hasActiveFilters = searchQuery.length > 0 || filterType !== 'all' || sortBy !== 'newest';

  return (
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
                <Input 
                  id="content-search" 
                  placeholder="Search content..." 
                  value={searchQuery} 
                  onChange={e => onSearchChange(e.target.value)} 
                  className="pl-10" 
                />
              </div>
            </div>
            <div className="flex gap-3">
              <CreateAssemblyDialog 
                trigger={
                  <Button variant="outline" size="sm">
                    <Layers className="h-4 w-4 mr-2" />
                    Create Assembly
                  </Button>
                }
              />
              <div>
                <Label htmlFor="content-type-filter" className="sr-only">
                  Filter by content type
                </Label>
                <Select value={filterType} onValueChange={onFilterChange}>
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
                <Select value={sortBy} onValueChange={onSortChange}>
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
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};