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

-- Create template search index
CREATE INDEX IF NOT EXISTS idx_content_templates_search ON content_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));
CREATE INDEX IF NOT EXISTS idx_content_templates_rating ON content_templates(rating DESC, download_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category, type);
CREATE INDEX IF NOT EXISTS idx_content_templates_complexity ON content_templates(complexity_level, min_plan_type);

-- Enable RLS on new tables
ALTER TABLE composite_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for composite_template_steps
CREATE POLICY "Users can view accessible template steps" ON composite_template_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_templates ct 
      WHERE ct.id = composite_template_steps.template_id 
      AND (
        (ct.is_public = true AND can_access_template(ct.min_plan_type, auth.uid())) 
        OR ct.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own template steps" ON composite_template_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content_templates ct 
      WHERE ct.id = composite_template_steps.template_id 
      AND ct.created_by = auth.uid()
    )
  );

-- RLS policies for template_reviews
CREATE POLICY "Users can view template reviews" ON template_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_templates ct 
      WHERE ct.id = template_reviews.template_id 
      AND (
        (ct.is_public = true AND can_access_template(ct.min_plan_type, auth.uid())) 
        OR ct.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create own reviews" ON template_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON template_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for template_usage_analytics  
CREATE POLICY "Users can view own usage analytics" ON template_usage_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Template creators can view their template analytics" ON template_usage_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_templates ct 
      WHERE ct.id = template_usage_analytics.template_id 
      AND ct.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own usage analytics" ON template_usage_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to update template rating when reviews change
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE content_templates 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM template_reviews 
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM template_reviews 
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_template_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON template_reviews
  FOR EACH ROW EXECUTE FUNCTION update_template_rating();

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_composite_template_steps_updated_at
  BEFORE UPDATE ON composite_template_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_reviews_updated_at
  BEFORE UPDATE ON template_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();