-- Fix RLS Policies for Public Access
-- Run this in your Supabase SQL Editor

-- First, let's check current policies (for reference)
-- SELECT * FROM pg_policies WHERE tablename IN ('products', 'categories');

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;

-- Create proper public read policies for categories
CREATE POLICY "Allow public read access to active categories"
ON categories FOR SELECT
TO public
USING (is_active = true);

-- Create proper public read policies for products  
CREATE POLICY "Allow public read access to active products"
ON products FOR SELECT
TO public
USING (is_active = true);

-- Also allow access to all categories for admin purposes (optional)
CREATE POLICY "Allow public read access to all categories"
ON categories FOR SELECT
TO public
USING (true);

-- Also allow access to all products for admin purposes (optional)
CREATE POLICY "Allow public read access to all products"
ON products FOR SELECT
TO public
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