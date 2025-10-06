-- Clean up storage policies to keep only admin-specific ones
-- Run this in Supabase SQL Editor to remove redundant policies

-- Remove general authenticated user policies (keep only admin-specific ones)
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;

-- Remove duplicate public read policy (keep the original one)
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;

-- Verify remaining policies (should only show admin-specific + one public read)
SELECT 
    policyname, 
    cmd, 
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN qual
        WHEN with_check IS NOT NULL THEN with_check
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (qual LIKE '%product-images%' OR with_check LIKE '%product-images%')
ORDER BY cmd, policyname;