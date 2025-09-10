-- Complete RLS Policies Fix for ED Stores
-- This script creates all necessary RLS policies to fix the data loading issues
-- Run this in your Supabase SQL Editor

-- ==============================================
-- PRODUCTS TABLE POLICIES
-- ==============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;
DROP POLICY IF EXISTS "Allow public read access to all products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to all products" ON products;

-- Create policies for products table
-- Public users can view active products
CREATE POLICY "Allow public read access to active products"
ON products FOR SELECT
TO public
USING (is_active = true);

-- Authenticated users can view active products
CREATE POLICY "Allow authenticated read access to active products"
ON products FOR SELECT
TO authenticated
USING (is_active = true);

-- ==============================================
-- CATEGORIES TABLE POLICIES
-- ==============================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow public read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to all categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to all categories" ON categories;

-- Create policies for categories table
-- Public users can view active categories
CREATE POLICY "Allow public read access to active categories"
ON categories FOR SELECT
TO public
USING (is_active = true);

-- Authenticated users can view active categories
CREATE POLICY "Allow authenticated read access to active categories"
ON categories FOR SELECT
TO authenticated
USING (is_active = true);

-- ==============================================
-- CART_ITEMS TABLE POLICIES
-- ==============================================

-- Enable RLS on cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can delete their own cart items" ON cart_items;

-- Create policies for cart_items table
-- Authenticated users can view their own cart items
CREATE POLICY "Authenticated users can view their own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Authenticated users can insert their own cart items
CREATE POLICY "Authenticated users can insert their own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own cart items
CREATE POLICY "Authenticated users can update their own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Authenticated users can delete their own cart items
CREATE POLICY "Authenticated users can delete their own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ==============================================
-- FAVORITES TABLE POLICIES
-- ==============================================

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

-- ==============================================
-- USER_PROFILES TABLE POLICIES
-- ==============================================

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

-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('products', 'categories', 'cart_items', 'favorites', 'user_profiles')
ORDER BY tablename;
