import { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];

export interface CategoryInfo {
  title: string;
  description: string;
  icon: string;
  cta: string;
  path: string;
}

// URL-to-content-type mapping from Phase 1
export const CONTENT_TYPE_ROUTES = {
  'emails': 'email_sequence',
  'social': 'social_post', 
  'landing': 'landing_page',
  'blogs': 'blog_post',
  'ads': 'ad_copy',
  'funnels': 'funnel',
  'strategy': 'strategy_brief'
} as const;

// Reverse mapping for URL generation
export const CONTENT_TYPE_TO_URL = Object.fromEntries(
  Object.entries(CONTENT_TYPE_ROUTES).map(([key, value]) => [value, key])
) as Record<ContentType, string>;

// Category information mapping
export const CATEGORY_INFO: Record<ContentType | 'all', CategoryInfo> = {
  'email_sequence': {
    title: 'Email Campaigns',
    description: 'Manage your email marketing campaigns',
    icon: 'Mail',
    cta: 'Create Email Campaign',
    path: 'email-campaigns'
  },
  'social_post': {
    title: 'Social Media Posts', 
    description: 'Create and manage social media content',
    icon: 'Share2',
    cta: 'Create Social Post',
    path: 'social-media'
  },
  'landing_page': {
    title: 'Landing Pages',
    description: 'Design high-converting landing pages', 
    icon: 'FileText',
    cta: 'Create Landing Page',
    path: 'landing-pages'
  },
  'blog_post': {
    title: 'Blog Posts',
    description: 'Write engaging blog content',
    icon: 'FileText', 
    cta: 'Create Blog Post',
    path: 'blog-posts'
  },
  'ad_copy': {
    title: 'Ad Copy',
    description: 'Create compelling advertising copy',
    icon: 'FileText',
    cta: 'Create Ad Copy', 
    path: 'ad-copy'
  },
  'funnel': {
    title: 'Sales Funnels',
    description: 'Build comprehensive sales funnels',
    icon: 'FileText',
    cta: 'Create Sales Funnel',
    path: 'sales-funnels'
  },
  'strategy_brief': {
    title: 'Strategy Briefs',
    description: 'Develop strategic marketing plans',
    icon: 'FileText',
    cta: 'Create Strategy Brief',
    path: 'strategy-briefs'
  },
  'all': {
    title: 'All Content',
    description: 'Manage and organize all your generated content',
    icon: 'FileText',
    cta: 'Generate Content',
    path: 'all'
  }
};

export function getCategoryInfo(contentType: ContentType | 'all'): CategoryInfo {
  return CATEGORY_INFO[contentType] || CATEGORY_INFO['all'];
}

export function generateStoragePath(userId: string, category: string, type: 'uploads' | 'exports' | 'images', filename?: string): string {
  const basePath = type === 'uploads' ? 'user-uploads' : 
                   type === 'exports' ? 'content-exports' : 'generated-images';
  
  const path = `${basePath}/${userId}/${category}`;
  return filename ? `${path}/${filename}` : path;
}

export function getContentTypeFromUrl(urlParam?: string): ContentType | 'all' {
  if (!urlParam || urlParam === 'all') return 'all';
  return CONTENT_TYPE_ROUTES[urlParam as keyof typeof CONTENT_TYPE_ROUTES] || 'all';
}

export function getUrlFromContentType(contentType: ContentType | 'all'): string {
  if (contentType === 'all') return 'all';
  return CONTENT_TYPE_TO_URL[contentType] || 'all';
}