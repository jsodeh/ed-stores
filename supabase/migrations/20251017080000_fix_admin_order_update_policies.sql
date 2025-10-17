-- Fix RLS policies to allow admin users to update orders
-- The existing "Admins can manage all orders" policy needs to be more specific

-- Drop the existing generic admin policy
DROP POLICY IF EXISTS "Admins can manage all orders" ON "public"."orders";

-- Create specific policies for admin operations
CREATE POLICY "Admins can view all orders" ON "public"."orders" 
FOR SELECT 
USING ((EXISTS ( 
  SELECT 1
  FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) 
    AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))
)));

CREATE POLICY "Admins can update all orders" ON "public"."orders" 
FOR UPDATE 
USING ((EXISTS ( 
  SELECT 1
  FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) 
    AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))
)))
WITH CHECK ((EXISTS ( 
  SELECT 1
  FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) 
    AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))
)));

CREATE POLICY "Admins can delete all orders" ON "public"."orders" 
FOR DELETE 
USING ((EXISTS ( 
  SELECT 1
  FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) 
    AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))
)));

-- Also create a stored procedure for updating order status that can be called by admin users
CREATE OR REPLACE FUNCTION update_order_status(order_id UUID, new_status order_status)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Check if the current user is an admin
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Only allow admin and super_admin to update order status
  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to update order status';
  END IF;
  
  -- Update the order status
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = order_id;
  
  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or could not be updated';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION update_order_status(UUID, order_status) TO authenticated;