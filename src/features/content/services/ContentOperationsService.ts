// Content Operations Service - Business Logic for Content Operations
import { toast } from 'sonner';
import type { ContentItem } from '../types';

export class ContentOperationsService {
  static handleToggleFavorite(
    id: string, 
    currentFavorite: boolean, 
    mutationFn: (id: string, isFavorite: boolean) => void
  ) {
    mutationFn(id, !currentFavorite);
  }

  static handleDeleteContent(
    id: string, 
    title: string, 
    mutationFn: (id: string) => void
  ) {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      mutationFn(id);
    }
  }

  static handleCopyContent(content: ContentItem['content']) {
    const textToCopy = typeof content === 'string' ? content : 
                      content?.text || JSON.stringify(content, null, 2);
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('Content copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy content');
    });
  }

  static getTypeIcon(type: string): string {
    switch (type) {
      case 'email_sequence': return 'Mail';
      case 'social_post': return 'Share2';
      default: return 'FileText';
    }
  }

  static getTypeLabel(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}