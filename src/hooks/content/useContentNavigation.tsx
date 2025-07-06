import { useNavigate, useSearchParams } from "react-router-dom";
import { getUrlFromContentType } from "@/utils/contentCategories";

export const useContentNavigation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navigateToContentType = (filterType: string, searchQuery: string, sortBy: string) => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    
    const urlPath = filterType === 'all' ? '/content' : `/content/${getUrlFromContentType(filterType as any)}`;
    navigate(`${urlPath}${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
  };

  const navigateToGenerate = (contentType?: string) => {
    const typeParam = contentType && contentType !== 'all' ? `?type=${contentType}` : '';
    navigate(`/generate${typeParam}`);
  };

  return {
    navigateToContentType,
    navigateToGenerate,
  };
};