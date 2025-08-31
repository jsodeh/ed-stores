-- Test Query to Mimic Frontend Product Fetching
-- Run this in your Supabase SQL Editor

-- This query mimics what the frontend is trying to do
-- Let's see if it returns data correctly

SELECT 
    p.id,
    p.name,
    p.price,
    p.description,
    p.image_url,
    p.category_id,
    p.is_active,
    c.id as category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.color as category_color
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;