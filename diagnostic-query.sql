-- Diagnostic Query to Check Data Availability
-- Run this in your Supabase SQL Editor

-- Check if there are any products in the database
SELECT COUNT(*) as product_count FROM products;

-- Check if there are any categories in the database
SELECT COUNT(*) as category_count FROM categories;

-- Check if there are any active products
SELECT COUNT(*) as active_product_count FROM products WHERE is_active = true;

-- Check if there are any active categories
SELECT COUNT(*) as active_category_count FROM categories WHERE is_active = true;

-- Show first 5 products
SELECT id, name, price, is_active FROM products LIMIT 5;

-- Show first 5 categories
SELECT id, name, is_active FROM categories LIMIT 5;