// Content Filters Hook - UI State Management
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ContentType, ContentTypeWithAll, ContentFilters } from '../types';

export const useContentFilters = (initialType?: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ContentFilters['sortBy']>('newest');
  
  // Determine filter type from URL or default to 'all'
  const filterType = useMemo(() => {
    return (initialType || 'all') as ContentTypeWithAll;
  }, [initialType]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSortChange = useCallback((value: ContentFilters['sortBy']) => {
    setSortBy(value);
  }, []);

  const handleFilterChange = useCallback((type: ContentTypeWithAll) => {
    // Update URL when filter changes
    const newPath = type === 'all' ? '/content' : `/content/${type}`;
    navigate(newPath, { replace: true });
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('newest');
    navigate('/content', { replace: true });
  }, [navigate]);

  const currentFilters = useMemo(() => ({
    type: filterType,
    search: searchQuery,
    sortBy,
    tags: [],
  }), [filterType, searchQuery, sortBy]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.length > 0 || filterType !== 'all' || sortBy !== 'newest';
  }, [searchQuery, filterType, sortBy]);

  return {
    // Current filter state
    searchQuery,
    filterType,
    sortBy,
    currentFilters,
    hasActiveFilters,
    
    // Filter actions
    handleSearchChange,
    handleSortChange,
    handleFilterChange,
    clearFilters,
  };
};