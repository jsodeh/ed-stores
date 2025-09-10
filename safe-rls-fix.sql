-- Safe RLS Fix - Drops ALL existing policies first, then creates clean ones
-- This prevents "policy already exists" errors
-- Run this in your Supabase SQL Editor

-- ==============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ==============================================

-- Drop ALL policies for user_profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- Drop ALL policies for favorites
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'favorites') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON favorites';
    END LOOP;
END $$;

-- Drop ALL policies for cart_items
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'cart_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON cart_items';
    END LOOP;
END $$;

-- Drop duplicate policies for products (keep the working public ones)
DROP POLICY IF EXISTS "Everyone can view active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Drop duplicate policies for categories (keep the working public ones)
DROP POLICY IF EXISTS "Everyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated read access to active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- ==============================================
-- STEP 2: CREATE CLEAN POLICIES
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
-- STEP 3: VERIFY POLICIES
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

-- Test queries (should work for authenticated users)
SELECT 
  'test_products' as test_type,
  COUNT(*) as count
FROM products
WHERE is_active = true;

SELECT 
  'test_categories' as test_type,
  COUNT(*) as count
FROM categories
WHERE is_active = true;
