// Content Operations Hook - Business Logic
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ContentService } from '../services/ContentService';
import { ContentOperationsService } from '../services/ContentOperationsService';
import type { ContentItem, ContentMutationOptions } from '../types';

export const useContentOperations = (options: ContentMutationOptions = {}) => {
  const queryClient = useQueryClient();
  const { 
    optimisticUpdate = true, 
    invalidateQueries = true, 
    showToast = true 
  } = options;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      return ContentService.toggleFavorite(id, isFavorite);
    },
    onSuccess: () => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['userContent'] });
      }
      if (showToast) {
        toast.success('Favorite updated successfully');
      }
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      if (showToast) {
        toast.error('Failed to update favorite');
      }
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: ContentService.deleteContent,
    onSuccess: () => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['userContent'] });
      }
      if (showToast) {
        toast.success('Content deleted successfully');
      }
    },
    onError: (error) => {
      console.error('Error deleting content:', error);
      if (showToast) {
        toast.error('Failed to delete content');
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ContentService.bulkDelete,
    onSuccess: () => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['userContent'] });
      }
      if (showToast) {
        toast.success('Content deleted successfully');
      }
    },
    onError: (error) => {
      console.error('Error bulk deleting content:', error);
      if (showToast) {
        toast.error('Failed to delete content');
      }
    },
  });

  const handleToggleFavorite = useCallback((id: string, currentFavorite: boolean) => {
    ContentOperationsService.handleToggleFavorite(id, currentFavorite, (id, isFavorite) => {
      toggleFavoriteMutation.mutate({ id, isFavorite });
    });
  }, [toggleFavoriteMutation]);

  const handleDeleteContent = useCallback((id: string, title: string) => {
    ContentOperationsService.handleDeleteContent(id, title, (id) => {
      deleteContentMutation.mutate(id);
    });
  }, [deleteContentMutation]);

  const handleBulkDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${ids.length} items?`)) {
      bulkDeleteMutation.mutate(ids);
    }
  }, [bulkDeleteMutation]);

  const handleCopyContent = useCallback((content: ContentItem['content']) => {
    ContentOperationsService.handleCopyContent(content);
  }, []);

  return {
    // Mutations
    toggleFavoriteMutation,
    deleteContentMutation,
    bulkDeleteMutation,
    
    // Handlers
    handleToggleFavorite,
    handleDeleteContent,
    handleBulkDelete,
    handleCopyContent,
    
    // Loading states
    isToggling: toggleFavoriteMutation.isPending,
    isDeleting: deleteContentMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
};