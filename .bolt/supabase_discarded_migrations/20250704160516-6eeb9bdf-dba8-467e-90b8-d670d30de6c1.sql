-- Phase 3: Final optimizations and cleanup (corrected)
-- Remove redundant or excessive indexes (keep only essential ones)

-- Remove potential redundant indexes on content_templates if they exist
DROP INDEX IF EXISTS idx_content_templates_category;
DROP INDEX IF EXISTS idx_content_templates_type;
DROP INDEX IF EXISTS idx_content_templates_is_public;
DROP INDEX IF EXISTS idx_content_templates_min_plan_type;
DROP INDEX IF EXISTS idx_content_templates_created_by;
DROP INDEX IF EXISTS idx_content_templates_is_featured;
DROP INDEX IF EXISTS idx_content_templates_rating;
DROP INDEX IF EXISTS idx_content_templates_usage_count;
DROP INDEX IF EXISTS idx_content_templates_tags;

-- Keep only essential indexes for content_templates
CREATE INDEX IF NOT EXISTS idx_content_templates_public_plan ON content_templates(is_public, min_plan_type) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_content_templates_user_content ON content_templates(created_by, updated_at DESC);

-- Add missing validation constraints using correct enum values
ALTER TABLE team_members ADD CONSTRAINT valid_team_role 
CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

ALTER TABLE team_members ADD CONSTRAINT valid_status 
CHECK (status IN ('active', 'inactive', 'pending'));

ALTER TABLE team_invitations ADD CONSTRAINT valid_invitation_status 
CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));

ALTER TABLE team_invitations ADD CONSTRAINT valid_invitation_role 
CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- Add email format validation
ALTER TABLE team_invitations ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE profiles ADD CONSTRAINT valid_profile_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add credits validation
ALTER TABLE user_credits ADD CONSTRAINT non_negative_credits_used 
CHECK (credits_used >= 0);

ALTER TABLE user_credits ADD CONSTRAINT non_negative_monthly_limit 
CHECK (monthly_limit >= 0);

-- Ensure profiles have required fields (they should already be NOT NULL)
-- These are likely already set, but adding for completeness
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN updated_at SET NOT NULL;