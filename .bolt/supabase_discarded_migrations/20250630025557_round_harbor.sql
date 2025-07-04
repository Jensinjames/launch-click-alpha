/*
  # Fix Profiles Policy Recursion and Authentication Issues

  1. Problem Analysis
    - Infinite recursion in profiles table policies
    - Authentication token expiry issues
    - Function dependencies preventing clean migration

  2. Solution
    - Drop dependent policies first before dropping functions
    - Create non-recursive policies for profiles table
    - Update helper functions safely
    - Maintain security while eliminating recursion

  3. Changes
    - Remove recursive policies on profiles table
    - Create simple auth.uid() based policies
    - Update helper functions with CASCADE handling
    - Ensure proper permissions and RLS
*/

-- First, drop all policies that depend on functions we need to update
-- This prevents dependency errors when dropping functions

-- Drop audit_logs policies that depend on is_admin_or_super
DROP POLICY IF EXISTS "Admin users can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Team admins can view team audit logs" ON audit_logs;

-- Drop plan_features policies that depend on is_super_admin
DROP POLICY IF EXISTS "Only super admins can manage plan features" ON plan_features;

-- Drop any other policies that might depend on these functions
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Now safely drop and recreate the functions
DROP FUNCTION IF EXISTS is_admin_or_super(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create helper functions that avoid recursion
-- These functions will be used by other tables, not by profiles table itself
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(user_id, auth.uid())
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(user_id, auth.uid())
    AND role = 'super_admin'
  );
$$;

-- Recreate the original helper functions with better implementation
CREATE OR REPLACE FUNCTION is_admin_or_super(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') 
     FROM profiles 
     WHERE id = COALESCE(user_id, auth.uid())), 
    false
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' 
     FROM profiles 
     WHERE id = COALESCE(user_id, auth.uid())), 
    false
  );
$$;

-- Create simple, non-recursive policies for profiles table
-- These policies only use auth.uid() and do not query profiles table within profiles policies

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Service role can manage all profiles (for admin operations and system functions)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recreate the audit_logs policies with the updated functions
CREATE POLICY "Admin users can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_or_super(auth.uid()));

CREATE POLICY "Team admins can view team audit logs"
  ON audit_logs
  FOR SELECT
  TO public
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS ( 
      SELECT 1
      FROM team_members tm
      WHERE (tm.user_id = auth.uid()) 
        AND (tm.role = ANY (ARRAY['owner'::team_role, 'admin'::team_role])) 
        AND (audit_logs.user_id IN ( 
          SELECT team_members.user_id
          FROM team_members
          WHERE (team_members.team_id = tm.team_id)
        ))
    ))
  );

-- Recreate plan_features policies
CREATE POLICY "Authenticated users can view plan features"
  ON plan_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can manage plan features"
  ON plan_features
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated, public;
GRANT EXECUTE ON FUNCTION is_super_admin_user(uuid) TO authenticated, public;
GRANT EXECUTE ON FUNCTION is_admin_or_super(uuid) TO authenticated, public;
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO authenticated, public;

-- Grant service_role full access for system operations
GRANT ALL ON profiles TO service_role;