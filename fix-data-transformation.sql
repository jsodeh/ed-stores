-- Fix Data Transformation Issues
-- This script addresses the data transformation problems that prevent products from showing
-- Run this in your Supabase SQL Editor

-- First, let's check if there are any products with is_active = false that might be filtered out
SELECT 
  'products' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM products;

-- Check categories
SELECT 
  'categories' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM categories;

-- Check if there are any products without categories (which would cause transformation to fail)
SELECT 
  'products_without_categories' as issue,
  COUNT(*) as count
FROM products 
WHERE category_id IS NULL;

-- Check if there are any products with invalid category_id references
SELECT 
  'products_with_invalid_categories' as issue,
  COUNT(*) as count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

-- Show sample of products with their category data
SELECT 
  p.id,
  p.name,
  p.is_active,
  p.category_id,
  c.name as category_name,
  c.is_active as category_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LIMIT 10;
