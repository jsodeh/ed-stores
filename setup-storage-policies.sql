-- Complete storage policies for product-images bucket
-- Run this in Supabase SQL Editor

-- Allow authenticated users to upload product images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access to product images
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to update product images (for admin edits)
CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete product images (for admin cleanup)
CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Verify the policies were created successfully
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