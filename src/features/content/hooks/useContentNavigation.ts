// Content Navigation Hook - Navigation Logic
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContentType, ContentTypeWithAll } from '../types';

export const useContentNavigation = () => {
  const navigate = useNavigate();

  const navigateToGenerate = useCallback(() => {
    navigate('/generate');
  }, [navigate]);

  const navigateToContent = useCallback((type?: ContentTypeWithAll) => {
    if (type && type !== 'all') {
      navigate(`/content/${type}`);
    } else {
      navigate('/content');
    }
  }, [navigate]);

  const navigateToContentItem = useCallback((id: string) => {
    navigate(`/content/item/${id}`);
  }, [navigate]);

  const navigateToContentEdit = useCallback((id: string) => {
    navigate(`/content/edit/${id}`);
  }, [navigate]);

  return {
    navigateToGenerate,
    navigateToContent,
    navigateToContentItem,
    navigateToContentEdit,
  };
};