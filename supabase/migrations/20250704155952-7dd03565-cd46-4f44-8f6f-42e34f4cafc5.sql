-- Phase 1: Remove duplicate prefixed tables and add foreign key constraints
-- The application uses clean table names (teams, profiles, etc.) so we can safely drop the prefixed duplicates

-- Drop duplicate prefixed tables
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_audit_logs CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_generated_content CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_integration_tokens CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_team_members CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_teams CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_user_credits CASCADE;
DROP TABLE IF EXISTS app_38b06dea2963452f9265ca4a0de19e02_user_plans CASCADE;

-- Add proper foreign key constraints to the clean tables
-- Teams to profiles (owner relationship)
ALTER TABLE teams 
ADD CONSTRAINT fk_teams_owner_profiles 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Team members to teams and profiles
ALTER TABLE team_members 
ADD CONSTRAINT fk_team_members_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_members 
ADD CONSTRAINT fk_team_members_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE team_members 
ADD CONSTRAINT fk_team_members_invited_by 
FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Team invitations to teams and profiles
ALTER TABLE team_invitations 
ADD CONSTRAINT fk_team_invitations_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_invitations 
ADD CONSTRAINT fk_team_invitations_invited_by 
FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- User plans to profiles
ALTER TABLE user_plans 
ADD CONSTRAINT fk_user_plans_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- User credits to profiles  
ALTER TABLE user_credits 
ADD CONSTRAINT fk_user_credits_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Generated content to profiles
ALTER TABLE generated_content 
ADD CONSTRAINT fk_generated_content_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Integration tokens to profiles
ALTER TABLE integration_tokens 
ADD CONSTRAINT fk_integration_tokens_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Team activity log to teams and profiles
ALTER TABLE team_activity_log 
ADD CONSTRAINT fk_team_activity_log_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_activity_log 
ADD CONSTRAINT fk_team_activity_log_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Content analytics to generated content
ALTER TABLE content_analytics 
ADD CONSTRAINT fk_content_analytics_content 
FOREIGN KEY (content_id) REFERENCES generated_content(id) ON DELETE CASCADE;

-- Content performance summary to generated content
ALTER TABLE content_performance_summary 
ADD CONSTRAINT fk_content_performance_content 
FOREIGN KEY (content_id) REFERENCES generated_content(id) ON DELETE CASCADE;