-- Test RLS Policies After Fix
-- Run this to verify that the policies are working correctly
-- Run this in your Supabase SQL Editor

-- Test 1: Check if we can query user_profiles (this should work for authenticated users)
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles
WHERE id = auth.uid();

-- Test 2: Check if we can query favorites (this should work for authenticated users)
SELECT 
  'favorites' as table_name,
  COUNT(*) as record_count
FROM favorites
WHERE user_id = auth.uid();

-- Test 3: Check if we can query cart_items (this should work for authenticated users)
SELECT 
  'cart_items' as table_name,
  COUNT(*) as record_count
FROM cart_items
WHERE user_id = auth.uid();

-- Test 4: Check if we can query products (this should work for everyone)
SELECT 
  'products' as table_name,
  COUNT(*) as record_count
FROM products
WHERE is_active = true;

-- Test 5: Check if we can query categories (this should work for everyone)
SELECT 
  'categories' as table_name,
  COUNT(*) as record_count
FROM categories
WHERE is_active = true;

-- Test 6: Show current user ID for debugging
SELECT 
  'current_user' as info,
  auth.uid() as user_id;
