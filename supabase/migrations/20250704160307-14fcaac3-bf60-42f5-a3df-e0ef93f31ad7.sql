-- Phase 2: Simplify over-engineered systems (corrected)
-- Remove unused content collaboration, commenting, and versioning system
DROP TABLE IF EXISTS content_collaborations CASCADE;
DROP TABLE IF EXISTS content_comments CASCADE;  
DROP TABLE IF EXISTS content_versions CASCADE;

-- Remove complex template system components
DROP TABLE IF EXISTS composite_template_steps CASCADE;
DROP TABLE IF EXISTS template_assets CASCADE;
DROP TABLE IF EXISTS template_reviews CASCADE;

-- Remove unused team templates (separate from content templates)
DROP TABLE IF EXISTS team_templates CASCADE;

-- Remove billing foreign table
DROP FOREIGN TABLE IF EXISTS billing CASCADE;

-- Remove unused feature usage tracking (had only dead tuples)
DROP TABLE IF EXISTS feature_usage_tracking CASCADE;

-- Remove email delivery logs table if not actively used
DROP TABLE IF EXISTS email_delivery_logs CASCADE;

-- Simplify user_plans table by removing duplicate Stripe data
-- (Keep Stripe data in dedicated Stripe tables only)
ALTER TABLE user_plans DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE user_plans DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE user_plans DROP COLUMN IF EXISTS current_period_end;

-- Add missing constraints and improve data validation  
ALTER TABLE user_plans ADD CONSTRAINT positive_credits 
CHECK (credits >= 0);

ALTER TABLE user_plans ADD CONSTRAINT positive_team_seats 
CHECK (team_seats > 0);

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_type ON user_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_credits_reset_at ON user_credits(reset_at);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_type ON generated_content(user_id, type);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);