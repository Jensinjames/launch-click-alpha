// Enhanced content type definitions
import { Database } from "@/integrations/supabase/types";

export type ContentType = Database['public']['Enums']['content_type'];
export type ContentTypeWithAll = ContentType | 'all';

export type SortOption = 'created_at' | 'title' | 'type' | 'updated_at';

export interface ContentQueryParams {
  type?: ContentType;
  search?: string;
  sortBy?: SortOption;
  limit?: number;
  offset?: number;
}

export interface TemplateData {
  prompt?: string;
  fields?: Array<{
    name: string;
    type: string;
    required?: boolean;
    placeholder?: string;
  }>;
  settings?: Record<string, unknown>;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  content: unknown;
  created_at: string;
  updated_at: string;
  user_id: string;
  content_performance_summary?: ContentPerformanceData | ContentPerformanceData[];
}

export interface ContentPerformanceData {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  engagement_rate: number;
}