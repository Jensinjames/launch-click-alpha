-- Add RLS policies for new tables
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