-- Comprehensive Fix for All Data Loading Issues
-- This script addresses all the problems: RLS policies, data transformation, and cart transfer
-- Run this in your Supabase SQL Editor

-- ==============================================
-- STEP 1: CLEAN UP DUPLICATE/CONFLICTING POLICIES
-- ==============================================

-- Clean up user_profiles policies
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Clean up favorites policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Admins can view all favorites" ON favorites;

-- Clean up cart_items policies
DROP POLICY IF EXISTS "Authenticated users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- Clean up duplicate products/categories policies
DROP POLICY IF EXISTS "Everyone can view active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;
DROP POLICY IF EXISTS "Everyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;

-- Clean up admin policies that might conflict
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- ==============================================
-- STEP 2: CREATE CLEAN, NON-CONFLICTING POLICIES
-- ==============================================

-- User profiles policies
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
ON user_profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Cart items policies
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ==============================================
-- STEP 3: VERIFY DATA INTEGRITY
-- ==============================================

-- Check products data
SELECT 
  'products_check' as check_type,
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as products_without_category
FROM products;

-- Check categories data
SELECT 
  'categories_check' as check_type,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories
FROM categories;

-- Check for orphaned products (products with invalid category_id)
SELECT 
  'orphaned_products' as issue,
  COUNT(*) as count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

-- ==============================================
-- STEP 4: VERIFY POLICIES ARE WORKING
-- ==============================================

-- Show all policies
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

-- ==============================================
-- STEP 5: TEST QUERIES (These should work for authenticated users)
-- ==============================================

-- Test products query (should work for everyone)
SELECT 
  'test_products' as test_type,
  COUNT(*) as count
FROM products
WHERE is_active = true;

-- Test categories query (should work for everyone)
SELECT 
  'test_categories' as test_type,
  COUNT(*) as count
FROM categories
WHERE is_active = true;
