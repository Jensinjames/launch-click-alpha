// Content Service - Data Layer Management
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem, ContentFilters, ContentQueryParams, DatabaseContentData, ContentData } from '../types';
import type { Tables } from '@/integrations/supabase/types';

export class ContentService {
  private static readonly TABLE_NAME = 'generated_content';

  static async getContent(params: ContentQueryParams = {}): Promise<ContentItem[]> {
    const { type, search, sortBy = 'newest', limit = 50, offset = 0 } = params;
    
    let query = supabase
      .from(this.TABLE_NAME)
      .select('*')
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply type filter
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,prompt.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'favorites':
        query = query.eq('is_favorite', true).order('updated_at', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
    
    return this.transformDatabaseItems(data || []);
  }

  private static transformDatabaseItems(items: Tables<'generated_content'>[]): ContentItem[] {
    return items.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type as ContentItem['type'],
      content: item.content as ContentData,
      created_at: item.created_at,
      updated_at: item.updated_at,
      is_favorite: item.is_favorite || false,
      metadata: item.metadata as ContentItem['metadata'],
      user_id: item.user_id,
      prompt: item.prompt,
      category_path: item.category_path || undefined,
      content_tags: item.content_tags || undefined,
      folder_structure: item.folder_structure as Record<string, unknown> || undefined,
    }));
  }

  static async getContentById(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching content by ID:', error);
      throw error;
    }

    return data ? this.transformDatabaseItems([data])[0] : null;
  }

  static async createContent(content: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>): Promise<ContentItem> {
    const dbContent = {
      title: content.title,
      type: content.type,
      content: content.content as any,
      user_id: content.user_id,
      prompt: content.prompt,
      is_favorite: content.is_favorite,
      metadata: content.metadata as any,
      category_path: content.category_path,
      content_tags: content.content_tags,
      folder_structure: content.folder_structure as any,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(dbContent)
      .select()
      .single();

    if (error) {
      console.error('Error creating content:', error);
      throw error;
    }

    return this.transformDatabaseItems([data])[0];
  }

  static async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
    const dbUpdates: any = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content as any;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata as any;
    if (updates.is_favorite !== undefined) dbUpdates.is_favorite = updates.is_favorite;
    if (updates.category_path !== undefined) dbUpdates.category_path = updates.category_path;
    if (updates.content_tags !== undefined) dbUpdates.content_tags = updates.content_tags;
    if (updates.folder_structure !== undefined) dbUpdates.folder_structure = updates.folder_structure as any;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content:', error);
      throw error;
    }

    return this.transformDatabaseItems([data])[0];
  }

  static async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  static async toggleFavorite(id: string, isFavorite: boolean): Promise<ContentItem> {
    return this.updateContent(id, { is_favorite: isFavorite });
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error bulk deleting content:', error);
      throw error;
    }
  }

  static async getContentStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    favorites: number;
    recent: number;
  }> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('type, is_favorite, created_at');

    if (error) {
      console.error('Error fetching content stats:', error);
      throw error;
    }

    const total = data.length;
    const byType = data.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favorites = data.filter(item => item.is_favorite).length;
    const recent = data.filter(item => {
      const created = new Date(item.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo;
    }).length;

    return { total, byType, favorites, recent };
  }
}