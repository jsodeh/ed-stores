-- Final RLS Fix for ED Stores - Resolves Data Loading Issues
-- This script completely resets and properly configures RLS policies
-- Run this in your Supabase SQL Editor

-- ==============================================
-- STEP 1: DISABLE ALL RLS TO TEST BASELINE
-- ==============================================
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 2: CLEAN UP ALL EXISTING POLICIES
-- ==============================================
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;
DROP POLICY IF EXISTS "Allow public read access to all products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to all products" ON products;
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to all categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to all categories" ON categories;

-- ==============================================
-- STEP 3: RE-ENABLE RLS
-- ==============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 4: CREATE CLEAN, NON-CONFLICTING POLICIES
-- ==============================================

-- PRODUCTS TABLE - Allow public read access to active products
CREATE POLICY "Public can read active products"
ON products FOR SELECT
TO public
USING (is_active = true);

-- CATEGORIES TABLE - Allow public read access to active categories
CREATE POLICY "Public can read active categories"
ON categories FOR SELECT
TO public
USING (is_active = true);

-- CART_ITEMS TABLE - Authenticated users can manage their own cart
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cart"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own cart"
ON cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- FAVORITES TABLE - Authenticated users can manage their own favorites
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- USER_PROFILES TABLE - Users can manage their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete own profile"
ON user_profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- ==============================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- ==============================================
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;

-- ==============================================
-- STEP 6: VERIFICATION QUERIES
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

-- Test data access
SELECT 'products_test' as test, COUNT(*) as count FROM products WHERE is_active = true;
SELECT 'categories_test' as test, COUNT(*) as count FROM categories WHERE is_active = true;