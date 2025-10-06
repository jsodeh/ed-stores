-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';

-- Check if storage.objects has RLS enabled
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'objects' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');