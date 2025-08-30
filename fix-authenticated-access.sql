-- Fix RLS Policies to Allow Authenticated User Access
-- Run this in your Supabase SQL Editor

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to all categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to all products" ON products;

-- Create policies for authenticated users to access categories
CREATE POLICY "Allow authenticated read access to active categories"
ON categories FOR SELECT
TO authenticated
USING (is_active = true);

-- Create policies for authenticated users to access all categories (optional)
CREATE POLICY "Allow authenticated read access to all categories"
ON categories FOR SELECT
TO authenticated
USING (true);

-- Create policies for authenticated users to access products
CREATE POLICY "Allow authenticated read access to active products"
ON products FOR SELECT
TO authenticated
USING (is_active = true);

-- Create policies for authenticated users to access all products (optional)
CREATE POLICY "Allow authenticated read access to all products"
ON products FOR SELECT
TO authenticated
USING (true);

-- Verify RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Check that policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('products', 'categories')
ORDER BY tablename, policyname;