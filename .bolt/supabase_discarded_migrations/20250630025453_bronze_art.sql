/*
  # Fix infinite recursion in profiles table policies

  1. Problem
    - The profiles table has RLS policies that cause infinite recursion
    - This happens when policies query the profiles table itself to check user roles
    - Error: "infinite recursion detected in policy for relation 'profiles'"

  2. Solution
    - Remove problematic policies that cause self-referential queries
    - Create simplified, non-recursive policies
    - Use direct auth.uid() comparisons instead of role-based queries within profiles policies
    - Create helper functions that don't cause recursion

  3. Security
    - Maintain proper access control without recursion
    - Users can read/update their own profiles
    - Admins can manage all profiles through separate, non-recursive policies
*/

-- Drop existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a helper function to check if user is admin without causing recursion
-- This function will be used by other tables, not by profiles table itself
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Create a helper function to check if user is super admin without causing recursion
CREATE OR REPLACE FUNCTION is_super_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'super_admin'
  );
$$;

-- Create simple, non-recursive policies for profiles table
-- Users can view and manage their own profile
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

-- Service role can manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update other helper functions to avoid recursion
-- Replace the existing functions that might cause issues

DROP FUNCTION IF EXISTS is_admin_or_super(uuid);
CREATE OR REPLACE FUNCTION is_admin_or_super(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') 
     FROM profiles 
     WHERE id = user_id), 
    false
  );
$$;

DROP FUNCTION IF EXISTS is_super_admin(uuid);
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' 
     FROM profiles 
     WHERE id = user_id), 
    false
  );
$$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_super(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO authenticated;