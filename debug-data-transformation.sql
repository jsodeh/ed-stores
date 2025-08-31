-- Debug Query to Test Data Transformation
-- Run this in your Supabase SQL Editor

-- This query mimics exactly what the frontend is trying to do
-- Let's see if there are any issues with the data structure

-- Test 1: Products with category join (similar to what frontend does)
SELECT 
    p.*,
    c.id as "categories.id",
    c.name as "categories.name",
    c.slug as "categories.slug",
    c.color as "categories.color"
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
LIMIT 3;

-- Test 2: Categories (similar to what frontend does)
SELECT *
FROM categories
WHERE is_active = true
ORDER BY sort_order ASC
LIMIT 10;