// Content Categories Utility - Moved from shared utils
import type { ContentType, ContentTypeWithAll, CategoryInfo } from '../types';

export const CONTENT_TYPE_ROUTES = {
  'email_sequence': 'email-campaigns',
  'social_post': 'social-media',
  'landing_page': 'landing-pages',
  'blog_post': 'blog-posts',
  'ad_copy': 'ad-copy',
  'funnel': 'sales-funnels',
  'strategy_brief': 'strategy-briefs',
  'all': 'all'
} as const;

export const getCategoryInfo = (type: ContentTypeWithAll): CategoryInfo => {
  switch (type) {
    case 'email_sequence':
      return {
        title: 'Email Campaigns',
        description: 'Manage your email marketing campaigns',
        icon: 'Mail',
        cta: 'Create Email Campaign',
        path: '/content/email_sequence'
      };
    case 'social_post':
      return {
        title: 'Social Media Posts',
        description: 'Create and manage social media content',
        icon: 'Share2',
        cta: 'Create Social Post',
        path: '/content/social_post'
      };
    case 'landing_page':
      return {
        title: 'Landing Pages',
        description: 'Design high-converting landing pages',
        icon: 'FileText',
        cta: 'Create Landing Page',
        path: '/content/landing_page'
      };
    case 'blog_post':
      return {
        title: 'Blog Posts',
        description: 'Write engaging blog content',
        icon: 'FileText',
        cta: 'Create Blog Post',
        path: '/content/blog_post'
      };
    case 'ad_copy':
      return {
        title: 'Ad Copy',
        description: 'Create compelling advertising copy',
        icon: 'FileText',
        cta: 'Create Ad Copy',
        path: '/content/ad_copy'
      };
    case 'funnel':
      return {
        title: 'Sales Funnels',
        description: 'Build comprehensive sales funnels',
        icon: 'FileText',
        cta: 'Create Sales Funnel',
        path: '/content/funnel'
      };
    case 'strategy_brief':
      return {
        title: 'Strategy Briefs',
        description: 'Develop strategic marketing plans',
        icon: 'FileText',
        cta: 'Create Strategy Brief',
        path: '/content/strategy_brief'
      };
    case 'all':
    default:
      return {
        title: 'All Content',
        description: 'Manage and organize all your generated content',
        icon: 'FileText',
        cta: 'Generate Content',
        path: '/content'
      };
  }
};