# RLS Policy Fix Instructions

This document provides step-by-step instructions to fix the data loading issue that occurs when users sign in to the ED Stores application.

## Problem Summary

When users sign in, the application gets stuck in a loading loop and doesn't display products or cart data. This is caused by conflicting or incorrect RLS (Row Level Security) policies in the Supabase database.

## Root Cause

The issue is caused by:
1. Conflicting RLS policies that prevent authenticated users from accessing public data
2. Missing or incorrect policy definitions for products and categories tables
3. The application switching from publicSupabase (which works) to authenticated supabase client (which fails due to policies)

## Solution Steps

### Step 1: Apply the RLS Fix Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `final-rls-fix.sql` into the editor
4. Run the entire script

This script will:
- Clean up all existing conflicting policies
- Create clean, non-conflicting policies
- Ensure products and categories are readable by both public and authenticated users
- Ensure user-specific data (cart, favorites, profile) is only accessible by the owner

### Step 2: Verify the Fix

After running the script, verify that the policies are correctly applied by running this query in the Supabase SQL Editor:

```sql
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
```

You should see policies like:
- "Public can read active products" for products table
- "Public can read active categories" for categories table
- User-specific policies for cart_items, favorites, and user_profiles

### Step 3: Test in Browser

1. Open the application in your browser
2. Open the developer console (F12)
3. Sign in with a user account
4. Run the `auth-debug.js` script in the console to verify data access

### Step 4: If Issues Persist

If you still experience issues after applying the fix:

1. Check the browser console for specific error messages
2. Look for 401/403 errors which indicate permission issues
3. Verify that the database actually contains data by running these queries in Supabase SQL Editor:

```sql
-- Check if products exist
SELECT COUNT(*) as product_count FROM products WHERE is_active = true;

-- Check if categories exist
SELECT COUNT(*) as category_count FROM categories WHERE is_active = true;
```

## Policy Details

The fix implements these key policies:

### Products Table
- Public users can read active products
- Authenticated users can read active products

### Categories Table
- Public users can read active categories
- Authenticated users can read active categories

### User-Specific Tables (cart_items, favorites, user_profiles)
- Users can only access their own data
- All operations (SELECT, INSERT, UPDATE, DELETE) are restricted to the data owner

## Troubleshooting

### If you see "Access Denied" messages:
1. Verify the policies were applied correctly
2. Check that the user has the correct role (authenticated)
3. Ensure the user exists in the user_profiles table

### If data still doesn't load:
1. Clear browser cache and localStorage
2. Restart the development server
3. Check network tab for failed requests and their status codes

### If you see an infinite loading spinner:
1. This usually indicates the application is stuck in a retry loop
2. Check that the `finally` block in `loadInitialData()` is being reached
3. Verify that `setLoading(false)` is being called

## Prevention

To prevent this issue in the future:
1. Always test RLS policies thoroughly after making changes
2. Avoid creating duplicate policies with the same or overlapping permissions
3. Document all policy changes
4. Use descriptive policy names to avoid confusion