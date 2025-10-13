# RLS Policy Fix Guide - Product Update Issue

## 🚨 **Problem Identified**

The console logs clearly show that **Row Level Security (RLS) policies** on the `products` table are completely blocking all updates, even for users with `super_admin` role.

### **Evidence from Logs:**
- ✅ User has `super_admin` role
- ✅ Test DB connection passes (simple updates work on other products)
- ❌ **"RLS policies are blocking all updates. Even basic name update failed"**
- ❌ Even updating just the `name` field returns "No rows affected"

## 🔍 **Root Cause**

The RLS policies on the `products` table are either:
1. **Missing admin bypass rules** for `super_admin` users
2. **Too restrictive** and blocking legitimate admin operations
3. **Incorrectly configured** for the specific product being updated

## 🛠️ **Solutions**

### **Option 1: Fix RLS Policies in Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard** → Your Project → Authentication → Policies
2. **Find the `products` table policies**
3. **Add or modify the UPDATE policy** to allow admin users:

```sql
-- Allow super_admin and admin users to update any product
CREATE POLICY "Admin users can update products" ON products
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'super_admin' OR 
  auth.jwt() ->> 'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);
```

### **Option 2: Temporary Disable RLS for Testing**

1. **Go to Supabase Dashboard** → Database → Tables → `products`
2. **Click on the `products` table**
3. **Temporarily disable RLS** to test if updates work
4. **Re-enable RLS** after confirming the issue

### **Option 3: Create Admin Bypass Function**

Create a database function that bypasses RLS:

```sql
-- Create admin update function
CREATE OR REPLACE FUNCTION admin_update_product(
  product_id UUID,
  product_data JSONB
) RETURNS products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_product products;
  user_role TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO user_role 
  FROM user_profiles 
  WHERE id = auth.uid();
  
  IF user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update the product (bypasses RLS)
  UPDATE products SET
    name = COALESCE(product_data->>'name', name),
    description = COALESCE(product_data->>'description', description),
    price = COALESCE((product_data->>'price')::NUMERIC, price),
    category_id = COALESCE((product_data->>'category_id')::UUID, category_id),
    sku = COALESCE(product_data->>'sku', sku),
    stock_quantity = COALESCE((product_data->>'stock_quantity')::INTEGER, stock_quantity),
    low_stock_threshold = COALESCE((product_data->>'low_stock_threshold')::INTEGER, low_stock_threshold),
    is_active = COALESCE((product_data->>'is_active')::BOOLEAN, is_active),
    is_featured = COALESCE((product_data->>'is_featured')::BOOLEAN, is_featured),
    image_url = COALESCE(product_data->>'image_url', image_url),
    weight = COALESCE((product_data->>'weight')::NUMERIC, weight),
    tags = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(product_data->'tags')), 
      tags
    ),
    updated_at = NOW()
  WHERE id = product_id
  RETURNING * INTO updated_product;
  
  RETURN updated_product;
END;
$$;
```

## 🎯 **Immediate Fix Steps**

### **Step 1: Check Current RLS Policies**

Run this query in Supabase SQL Editor:

```sql
-- Check existing RLS policies on products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products';
```

### **Step 2: Check User Profile**

Verify the user's role in the database:

```sql
-- Check user role
SELECT id, email, role 
FROM user_profiles 
WHERE id = '64411142-72a2-4ce7-9b8f-cb8eb2dd69ee';
```

### **Step 3: Test Direct Update**

Try updating the product directly in SQL Editor:

```sql
-- Test direct update (this should work if RLS is the issue)
UPDATE products 
SET name = 'Test Update - ' || NOW()
WHERE id = '654ba4ed-ae27-49b3-8deb-c87b8d8fb214';
```

## 🔧 **Quick Fix for Development**

If you need to fix this immediately for development:

1. **Disable RLS temporarily** on the products table
2. **Test the product update** to confirm it works
3. **Re-enable RLS** and fix the policies properly

```sql
-- Temporarily disable RLS (DEVELOPMENT ONLY)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Test your updates...

-- Re-enable RLS (IMPORTANT!)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

## ⚠️ **Important Notes**

1. **This is a database configuration issue**, not a code issue
2. **The app code is working correctly** - the problem is in Supabase RLS policies
3. **Super admin users should be able to update any product** - the policies need to reflect this
4. **Never disable RLS in production** without proper policies in place

## 🎯 **Recommended Action**

**Go to your Supabase Dashboard and check/fix the RLS policies on the `products` table.** The policies should allow `super_admin` and `admin` users to perform all operations on products.

Once the RLS policies are fixed, the product updates will work immediately without any code changes needed.