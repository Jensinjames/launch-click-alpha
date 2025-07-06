import { toast } from "sonner";

export class ContentOperationsService {
  static async handleToggleFavorite(
    id: string, 
    currentFavorite: boolean, 
    toggleFavoriteMutation: any
  ) {
    try {
      await toggleFavoriteMutation.mutateAsync({ id, is_favorite: !currentFavorite });
      toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  }

  static async handleDeleteContent(
    id: string, 
    title: string, 
    deleteContentMutation: any
  ) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await deleteContentMutation.mutateAsync(id);
      toast.success('Content deleted successfully');
    } catch (error) {
      toast.error('Failed to delete content');
    }
  }

  static async handleCopyContent(content: any) {
    try {
      const textToCopy = content?.text || JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  }

  static getStatusColor(status: string) {
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
  }

  static getTypeLabel(type: string) {
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
  }

  static getTypeIcon(type: string) {
    const iconMap = {
      'email_sequence': 'Mail',
      'social_post': 'Share2',
      'landing_page': 'FileText',
      'blog_post': 'FileText',
      'strategy_brief': 'FileText',
      'ad_copy': 'MoreHorizontal',
      'funnel': 'FileText'
    } as const;
    
    return iconMap[type as keyof typeof iconMap] || 'FileText';
  }
}