-- Add composite template support and enhanced sharing features
ALTER TABLE content_templates 
ADD COLUMN IF NOT EXISTS sharing_credits_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'simple' CHECK (complexity_level IN ('simple', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create composite template steps table
CREATE TABLE IF NOT EXISTS composite_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES content_templates(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  template_ref UUID REFERENCES content_templates(id),
  template_data JSONB,
  input_mapping JSONB DEFAULT '{}',
  output_mapping JSONB DEFAULT '{}',
  depends_on TEXT[] DEFAULT '{}',
  is_conditional BOOLEAN DEFAULT false,
  condition_logic JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create template reviews table
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES content_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_usage BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Create template usage analytics table
CREATE TABLE IF NOT EXISTS template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES content_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  input_data JSONB,
  output_quality_score DECIMAL(3,2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create simple indexes (avoiding function-based indexes for now)
CREATE INDEX IF NOT EXISTS idx_content_templates_name ON content_templates(name);
CREATE INDEX IF NOT EXISTS idx_content_templates_tags ON content_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_content_templates_rating ON content_templates(rating DESC, download_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category, type);
CREATE INDEX IF NOT EXISTS idx_content_templates_complexity ON content_templates(complexity_level, min_plan_type);

-- Enable RLS on new tables
ALTER TABLE composite_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;