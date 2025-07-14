// Content Page - Main Content Management Component
import { useParams } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useUserContent } from "@/hooks/useUserContent";
import { getCategoryInfo } from "../utils/contentCategories";
import { CategoryHeader } from "./CategoryHeader";
import { ContentFilters } from "./ContentFilters";
import { ContentGrid } from "./ContentGrid";
import { useContentFilters } from "../hooks/useContentFilters";
import { useContentNavigation } from "../hooks/useContentNavigation";
import { useContentOperations } from "../hooks/useContentOperations";
import type { ContentType, ContentTypeWithAll } from "../types";

export const ContentPage = () => {
  const { type: urlType } = useParams<{ type?: string }>();
  
  const {
    searchQuery,
    filterType,
    sortBy,
    currentFilters,
    handleSearchChange,
    handleSortChange,
    handleFilterChange,
    clearFilters,
  } = useContentFilters(urlType);
  
  const { navigateToGenerate } = useContentNavigation();
  
  const { 
    handleToggleFavorite, 
    handleDeleteContent, 
    handleCopyContent 
  } = useContentOperations();

  const { data: contentItems = [], isLoading, error } = useUserContent({
    type: filterType === 'all' ? undefined : filterType,
    search: searchQuery,
    sortBy: sortBy as any // TODO: Fix type mismatch
  });

  // Get category information for dynamic header
  const currentContentType: ContentTypeWithAll = filterType;
  const categoryInfo = getCategoryInfo(currentContentType);

  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-6xl mx-auto">
          <CategoryHeader 
            categoryInfo={categoryInfo}
            contentType={currentContentType}
          />

          <ContentFilters
            searchQuery={searchQuery}
            filterType={filterType}
            sortBy={sortBy}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onClearFilters={clearFilters}
          />

          <ContentGrid
            contentItems={contentItems}
            isLoading={isLoading}
            error={error}
            categoryInfo={categoryInfo}
            onToggleFavorite={handleToggleFavorite}
            onDeleteContent={handleDeleteContent}
            onCopyContent={handleCopyContent}
            onNavigateToGenerate={navigateToGenerate}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
};