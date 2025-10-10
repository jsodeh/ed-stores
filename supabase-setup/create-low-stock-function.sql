-- Creates a function to efficiently get products where stock is below the threshold.
-- This is the recommended way to perform column-to-column comparisons in Supabase.

CREATE OR REPLACE FUNCTION get_low_stock_products(limit_count INT)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.products
  WHERE stock_quantity < low_stock_threshold
  ORDER BY stock_quantity ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
