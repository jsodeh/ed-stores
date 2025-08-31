-- Check if categories have slugs
-- Run this in your Supabase SQL Editor

SELECT 
    id,
    name,
    slug,
    is_active
FROM categories
WHERE is_active = true
ORDER BY name;