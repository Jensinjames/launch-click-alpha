-- Fix critical database issues identified in audit

-- 1. Add RLS policy to feature_hierarchy table (currently has RLS enabled but no policies)
CREATE POLICY "Anyone can view feature hierarchy" 
ON public.feature_hierarchy 
FOR SELECT 
USING (true);

-- 2. Remove duplicate foreign key constraints from team_members table
-- Keep only the profiles references, remove auth.users references
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_invited_by_fkey;