// Content Types - Centralized Type Definitions
export type ContentType = 
  | 'email_sequence'
  | 'social_post'
  | 'landing_page'
  | 'blog_post'
  | 'ad_copy'
  | 'funnel'
  | 'strategy_brief';

export type ContentTypeWithAll = ContentType | 'all';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  content: ContentData;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  metadata?: ContentMetadata;
  user_id: string;
  prompt: string;
  category_path?: string;
  content_tags?: string[];
  folder_structure?: Record<string, unknown>;
}

export interface ContentData {
  text?: string;
  html?: string;
  subject?: string;
  body?: string;
  headline?: string;
  description?: string;
  call_to_action?: string;
  [key: string]: unknown;
}

// Database type alias to match Supabase JSON type
export type DatabaseContentData = Record<string, unknown> | string | number | boolean | null | undefined;

export interface ContentMetadata {
  creditsCost?: number;
  templateUsed?: string;
  generationTime?: number;
  promptTokens?: number;
  completionTokens?: number;
  [key: string]: unknown;
}

export interface ContentFilters {
  type: ContentTypeWithAll;
  search: string;
  sortBy: 'newest' | 'oldest' | 'favorites' | 'title';
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ContentOperationsOptions {
  includeMetadata?: boolean;
  formatOutput?: boolean;
  useToast?: boolean;
}

export interface CategoryInfo {
  title: string;
  description: string;
  icon: string;
  cta: string;
  path?: string;
}

export interface ContentQueryParams {
  type?: ContentTypeWithAll;
  search?: string;
  sortBy?: ContentFilters['sortBy'];
  limit?: number;
  offset?: number;
}

export interface ContentMutationOptions {
  optimisticUpdate?: boolean;
  invalidateQueries?: boolean;
  showToast?: boolean;
}