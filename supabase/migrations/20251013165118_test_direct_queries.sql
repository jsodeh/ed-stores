-- Test direct table access
DO $$
DECLARE
    product_count INTEGER;
    category_count INTEGER;
    active_product_count INTEGER;
    active_category_count INTEGER;
BEGIN
    -- Count total products
    SELECT COUNT(*) INTO product_count FROM products;
    RAISE NOTICE 'Total products: %', product_count;
    
    -- Count total categories  
    SELECT COUNT(*) INTO category_count FROM categories;
    RAISE NOTICE 'Total categories: %', category_count;
    
    -- Count active products
    SELECT COUNT(*) INTO active_product_count FROM products WHERE is_active = true;
    RAISE NOTICE 'Active products: %', active_product_count;
    
    -- Count active categories
    SELECT COUNT(*) INTO active_category_count FROM categories WHERE is_active = true;
    RAISE NOTICE 'Active categories: %', active_category_count;
    
    -- Test product_details view
    SELECT COUNT(*) INTO product_count FROM product_details;
    RAISE NOTICE 'Product details view count: %', product_count;
    
END $$;