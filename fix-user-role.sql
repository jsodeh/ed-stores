-- SQL script to check and fix user role for jsodeh@gmail.com
-- Run this in your Supabase SQL Editor

-- First, check if the user exists in user_profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
WHERE email = 'jsodeh@gmail.com';

-- If the user exists, update the role to super_admin
UPDATE user_profiles 
SET role = 'super_admin'
WHERE email = 'jsodeh@gmail.com';

-- If the user doesn't exist, create a profile for them
-- First, find the user ID from auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'jsodeh@gmail.com';

-- Then insert a profile for the user (replace 'USER_ID_HERE' with the actual ID from above)
/*
INSERT INTO user_profiles (id, email, full_name, role)
VALUES ('USER_ID_HERE', 'jsodeh@gmail.com', 'Joseph Sodeh', 'super_admin');
*/

-- Verify the update/insert
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
WHERE email = 'jsodeh@gmail.com';

-- Check RLS policies for user_profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;