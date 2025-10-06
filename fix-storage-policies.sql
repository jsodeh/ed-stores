-- Fix storage policies for product images
-- Run this in your Supabase SQL editor

-- First, check existing policies
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;

-- Create policy for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Create policy for public read access
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Grant necessary permissions to the storage schema
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;

-- Make sure the bucket exists and is public
-- You may need to create the bucket via the Supabase dashboard or API if it doesn't exist