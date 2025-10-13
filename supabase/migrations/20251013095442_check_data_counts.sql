-- Check if tables have data
SELECT 'products' as table_name, COUNT(*) as total_count FROM products
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as total_count FROM categories
UNION ALL  
SELECT 'active_products' as table_name, COUNT(*) as total_count FROM products WHERE is_active = true
UNION ALL
SELECT 'active_categories' as table_name, COUNT(*) as total_count FROM categories WHERE is_active = true;