-- Final Cart RLS Policies Fix
-- This script ensures both authenticated and guest users can manage carts
-- Run this in your Supabase SQL Editor

-- Enable RLS on cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;

-- Create policies for cart_items table - ONLY for authenticated users
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

-- IMPORTANT: No policies are created for the public role
-- Guest users will manage their carts via localStorage in the frontend
-- This is more secure and appropriate for guest cart functionality

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
WHERE tablename = 'cart_items'
ORDER BY policyname;