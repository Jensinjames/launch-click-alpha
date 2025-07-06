import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getContentTypeFromUrl } from "@/utils/contentCategories";

export const useContentFilters = (urlType?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Initialize state from URL parameters and search params
  useEffect(() => {
    const contentType = getContentTypeFromUrl(urlType);
    setFilterType(contentType);
    
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    
    setSearchQuery(search);
    setSortBy(sort);
  }, [urlType, searchParams]);

  // Update URL when filters change
  const updateFilters = (newSearch: string, newSort: string, newFilter: string) => {
    const params = new URLSearchParams();
    
    if (newSearch) params.set('search', newSearch);
    if (newSort !== 'newest') params.set('sort', newSort);
    
    setSearchParams(params);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters(value, sortBy, filterType);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateFilters(searchQuery, value, filterType);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    updateFilters(searchQuery, sortBy, value);
  };

  return {
    searchQuery,
    filterType,
    sortBy,
    handleSearchChange,
    handleSortChange,
    handleFilterChange,
  };
};