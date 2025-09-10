-- Fix Missing RLS Policies for Favorites and User Profiles
-- This script creates the missing RLS policies that are causing 500 errors
-- Run this in your Supabase SQL Editor

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Create policies for favorites table
-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create policies for user_profiles table
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON user_profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Verify policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('favorites', 'user_profiles')
ORDER BY tablename, policyname;
