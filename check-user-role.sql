-- SQL script to check user role in the database
-- Run this in your Supabase SQL Editor

-- First, find the user by email
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
WHERE email = 'jsodeh@gmail.com';

-- Check if the user exists in the auth.users table
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'jsodeh@gmail.com';

-- If the user exists but doesn't have a profile, you might need to create one:
/*
INSERT INTO user_profiles (id, email, full_name, role)
VALUES ('USER_ID_FROM_ABOVE', 'jsodeh@gmail.com', 'Your Name', 'super_admin');
*/

-- Update existing user to super_admin role
UPDATE user_profiles 
SET role = 'super_admin'
WHERE email = 'jsodeh@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
WHERE email = 'jsodeh@gmail.com';