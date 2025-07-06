-- Phase 2: Content Categories and Storage Organization - Database Schema Updates

-- Add category and organization fields to generated_content
ALTER TABLE public.generated_content 
ADD COLUMN IF NOT EXISTS category_path TEXT,
ADD COLUMN IF NOT EXISTS folder_structure JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_tags TEXT[] DEFAULT '{}';

-- Add category context to content_analytics
ALTER TABLE public.content_analytics
ADD COLUMN IF NOT EXISTS category_context JSONB DEFAULT '{}';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_generated_content_category_path ON public.generated_content(category_path);
CREATE INDEX IF NOT EXISTS idx_generated_content_tags ON public.generated_content USING GIN(content_tags);
CREATE INDEX IF NOT EXISTS idx_content_analytics_category ON public.content_analytics USING GIN(category_context);

-- Create function to generate category path based on content type
CREATE OR REPLACE FUNCTION public.generate_category_path(content_type content_type)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE content_type
    WHEN 'email_sequence' THEN 'email-campaigns'
    WHEN 'social_post' THEN 'social-media'
    WHEN 'landing_page' THEN 'landing-pages'
    WHEN 'blog_post' THEN 'blog-posts'
    WHEN 'ad_copy' THEN 'ad-copy'
    WHEN 'funnel' THEN 'sales-funnels'
    WHEN 'strategy_brief' THEN 'strategy-briefs'
    ELSE 'general'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get category display info
CREATE OR REPLACE FUNCTION public.get_category_info(content_type content_type)
RETURNS JSONB AS $$
BEGIN
  RETURN CASE content_type
    WHEN 'email_sequence' THEN jsonb_build_object(
      'title', 'Email Campaigns',
      'description', 'Manage your email marketing campaigns',
      'icon', 'Mail',
      'cta', 'Create Email Campaign'
    )
    WHEN 'social_post' THEN jsonb_build_object(
      'title', 'Social Media Posts',
      'description', 'Create and manage social media content',
      'icon', 'Share2',
      'cta', 'Create Social Post'
    )
    WHEN 'landing_page' THEN jsonb_build_object(
      'title', 'Landing Pages',
      'description', 'Design high-converting landing pages',
      'icon', 'FileText',
      'cta', 'Create Landing Page'
    )
    WHEN 'blog_post' THEN jsonb_build_object(
      'title', 'Blog Posts',
      'description', 'Write engaging blog content',
      'icon', 'FileText',
      'cta', 'Create Blog Post'
    )
    WHEN 'ad_copy' THEN jsonb_build_object(
      'title', 'Ad Copy',
      'description', 'Create compelling advertising copy',
      'icon', 'FileText',
      'cta', 'Create Ad Copy'
    )
    WHEN 'funnel' THEN jsonb_build_object(
      'title', 'Sales Funnels',
      'description', 'Build comprehensive sales funnels',
      'icon', 'FileText',
      'cta', 'Create Sales Funnel'
    )
    WHEN 'strategy_brief' THEN jsonb_build_object(
      'title', 'Strategy Briefs',
      'description', 'Develop strategic marketing plans',
      'icon', 'FileText',
      'cta', 'Create Strategy Brief'
    )
    ELSE jsonb_build_object(
      'title', 'All Content',
      'description', 'Manage and organize all your generated content',
      'icon', 'FileText',
      'cta', 'Generate Content'
    )
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing content with category paths (backward compatibility)
UPDATE public.generated_content 
SET category_path = generate_category_path(type),
    folder_structure = jsonb_build_object(
      'category', generate_category_path(type),
      'created_at', created_at,
      'migrated', true
    )
WHERE category_path IS NULL;