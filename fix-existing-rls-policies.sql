-- Fix Existing RLS Policies Issues
-- This script fixes the specific problems with the current RLS policies
-- Run this in your Supabase SQL Editor

-- ==============================================
-- FIX USER_PROFILES TABLE POLICIES
-- ==============================================

-- Drop conflicting/duplicate policies for user_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create clean, non-conflicting policies for user_profiles
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

-- ==============================================
-- FIX FAVORITES TABLE POLICIES
-- ==============================================

-- Drop conflicting/duplicate policies for favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Create clean, non-conflicting policies for favorites
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

-- ==============================================
-- FIX CART_ITEMS TABLE POLICIES
-- ==============================================

-- Drop conflicting/duplicate policies for cart_items
DROP POLICY IF EXISTS "Authenticated users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can delete their own cart items" ON cart_items;

-- Create clean, non-conflicting policies for cart_items
-- Users can view their own cart items
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own cart items
CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own cart items
CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own cart items
CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ==============================================
-- CLEAN UP DUPLICATE CATEGORIES POLICIES
-- ==============================================

-- Drop duplicate policies for categories
DROP POLICY IF EXISTS "Everyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;

-- Keep only the public policy for categories (it's working)
-- The "Allow public read access to active categories" policy is sufficient

-- ==============================================
-- CLEAN UP DUPLICATE PRODUCTS POLICIES
-- ==============================================

-- Drop duplicate policies for products
DROP POLICY IF EXISTS "Everyone can view active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;

-- Keep only the public policy for products (it's working)
-- The "Allow public read access to active products" policy is sufficient

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check that all policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('products', 'categories', 'cart_items', 'favorites', 'user_profiles')
ORDER BY tablename, policyname;
