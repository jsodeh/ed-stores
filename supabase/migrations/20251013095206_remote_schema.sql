

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_admin_notification"("p_title" "text", "p_message" "text", "p_type" "text" DEFAULT NULL::"text", "p_action_url" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    SELECT id, p_title, p_message, p_type, p_action_url
    FROM user_profiles
    WHERE role = 'admin' OR role = 'super_admin';
END;
$$;


ALTER FUNCTION "public"."create_admin_notification"("p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text" DEFAULT NULL::"text", "p_action_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_from_cart"("p_user_id" "uuid", "p_delivery_address_id" "uuid", "p_delivery_notes" "text" DEFAULT NULL::"text", "p_payment_method" "text" DEFAULT 'cash'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
  v_subtotal DECIMAL(12,2) := 0;
  v_delivery_fee DECIMAL(10,2) := 2500; -- Default delivery fee
  v_total DECIMAL(12,2);
  cart_item RECORD;
BEGIN
  -- Calculate subtotal from cart
  SELECT COALESCE(SUM(ci.quantity * p.price), 0) INTO v_subtotal
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = p_user_id;
  
  -- Free delivery over 50,000
  IF v_subtotal >= 50000 THEN
    v_delivery_fee := 0;
  END IF;
  
  v_total := v_subtotal + v_delivery_fee;
  
  -- Create order
  INSERT INTO orders (
    user_id, subtotal, delivery_fee, total_amount, 
    delivery_address_id, delivery_notes, payment_method
  ) VALUES (
    p_user_id, v_subtotal, v_delivery_fee, v_total,
    p_delivery_address_id, p_delivery_notes, p_payment_method
  ) RETURNING id INTO v_order_id;
  
  -- Create order items from cart
  FOR cart_item IN 
    SELECT ci.product_id, ci.quantity, p.price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = p_user_id
  LOOP
    -- Insert order item
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (
      v_order_id, 
      cart_item.product_id, 
      cart_item.quantity, 
      cart_item.price,
      cart_item.quantity * cart_item.price
    );
    
    -- Update stock
    PERFORM update_product_stock(
      cart_item.product_id,
      cart_item.quantity,
      'out',
      'Order placed',
      v_order_id,
      'order'
    );
  END LOOP;
  
  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  RETURN v_order_id;
END;
$$;


ALTER FUNCTION "public"."create_order_from_cart"("p_user_id" "uuid", "p_delivery_address_id" "uuid", "p_delivery_notes" "text", "p_payment_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "category_id" "uuid",
    "image_url" "text",
    "images" "text"[] DEFAULT '{}'::"text"[],
    "sku" "text",
    "stock_quantity" integer DEFAULT 0,
    "low_stock_threshold" integer DEFAULT 10,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "weight" numeric(8,2),
    "dimensions" "jsonb",
    "meta_title" "text",
    "meta_description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_stock_quantity_check" CHECK (("stock_quantity" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_low_stock_products"("limit_count" integer) RETURNS SETOF "public"."products"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.products
  WHERE stock_quantity < low_stock_threshold
  ORDER BY stock_quantity ASC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_low_stock_products"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_details"() RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "price" numeric, "category_id" "uuid", "image_url" "text", "images" "text"[], "sku" "text", "stock_quantity" integer, "low_stock_threshold" integer, "is_active" boolean, "is_featured" boolean, "weight" numeric, "dimensions" "jsonb", "meta_title" "text", "meta_description" "text", "tags" "text"[], "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "category_name" "text", "category_slug" "text", "category_color" "text", "average_rating" numeric, "review_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category_id,
    p.image_url,
    p.images,
    p.sku,
    p.stock_quantity,
    p.low_stock_threshold,
    p.is_active,
    p.is_featured,
    p.weight,
    p.dimensions,
    p.meta_title,
    p.meta_description,
    p.tags,
    p.created_at,
    p.updated_at,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color AS category_color,
    COALESCE(avg(pr.rating), 0::numeric) AS average_rating,
    count(pr.id) AS review_count
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
  WHERE p.is_active = true
  GROUP BY p.id, c.name, c.slug, c.color;
$$;


ALTER FUNCTION "public"."get_product_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_stock"("p_product_id" "uuid", "p_quantity" integer, "p_type" "text", "p_reason" "text" DEFAULT NULL::"text", "p_reference_id" "uuid" DEFAULT NULL::"uuid", "p_reference_type" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO current_stock 
  FROM products 
  WHERE id = p_product_id;
  
  -- Check if product exists
  IF current_stock IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if we have enough stock for 'out' transactions
  IF p_type = 'out' AND current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Update stock
  IF p_type = 'in' OR p_type = 'adjustment' THEN
    UPDATE products 
    SET stock_quantity = stock_quantity + p_quantity 
    WHERE id = p_product_id;
  ELSIF p_type = 'out' THEN
    UPDATE products 
    SET stock_quantity = stock_quantity - p_quantity 
    WHERE id = p_product_id;
  END IF;
  
  -- Record transaction
  INSERT INTO inventory_transactions (
    product_id, type, quantity, reason, reference_id, reference_type
  ) VALUES (
    p_product_id, p_type, p_quantity, p_reason, p_reference_id, p_reference_type
  );
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_product_stock"("p_product_id" "uuid", "p_quantity" integer, "p_type" "text", "p_reason" "text", "p_reference_id" "uuid", "p_reference_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" DEFAULT 'home'::"text",
    "street_address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "postal_code" "text",
    "country" "text" DEFAULT 'Nigeria'::"text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "addresses_type_check" CHECK (("type" = ANY (ARRAY['home'::"text", 'work'::"text", 'other'::"text", 'delivery'::"text", 'shipping'::"text"])))
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text" DEFAULT '#F59E0B'::"text",
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "product_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "type" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "reason" "text",
    "reference_id" "uuid",
    "reference_type" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventory_transactions_type_check" CHECK (("type" = ANY (ARRAY['in'::"text", 'out'::"text", 'adjustment'::"text"])))
);


ALTER TABLE "public"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid",
    "recipient_id" "uuid",
    "subject" "text",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "message_type" "text" DEFAULT 'general'::"text",
    "related_order_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['support'::"text", 'order'::"text", 'general'::"text", 'marketing'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'system'::"text",
    "is_read" boolean DEFAULT false,
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['order'::"text", 'promotion'::"text", 'system'::"text", 'review'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."order_details" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "user_id",
    NULL::"text" AS "order_number",
    NULL::"public"."order_status" AS "status",
    NULL::numeric(12,2) AS "total_amount",
    NULL::numeric(12,2) AS "subtotal",
    NULL::numeric(10,2) AS "delivery_fee",
    NULL::numeric(10,2) AS "tax_amount",
    NULL::numeric(10,2) AS "discount_amount",
    NULL::"uuid" AS "delivery_address_id",
    NULL::"text" AS "delivery_notes",
    NULL::timestamp with time zone AS "delivery_date",
    NULL::"text" AS "payment_method",
    NULL::"text" AS "payment_status",
    NULL::"text" AS "payment_reference",
    NULL::"text" AS "notes",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text" AS "customer_name",
    NULL::"text" AS "customer_email",
    NULL::"text" AS "customer_phone",
    NULL::"text" AS "street_address",
    NULL::"text" AS "city",
    NULL::"text" AS "state",
    NULL::"text" AS "postal_code",
    NULL::bigint AS "item_count";


ALTER TABLE "public"."order_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_total_price_check" CHECK (("total_price" >= (0)::numeric)),
    CONSTRAINT "order_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "order_number" "text" NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "total_amount" numeric(12,2) NOT NULL,
    "subtotal" numeric(12,2) NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "delivery_address_id" "uuid",
    "delivery_notes" "text",
    "delivery_date" timestamp with time zone,
    "payment_method" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_reference" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "orders_delivery_fee_check" CHECK (("delivery_fee" >= (0)::numeric)),
    CONSTRAINT "orders_discount_amount_check" CHECK (("discount_amount" >= (0)::numeric)),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "orders_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "orders_tax_amount_check" CHECK (("tax_amount" >= (0)::numeric)),
    CONSTRAINT "orders_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."product_details" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "name",
    NULL::"text" AS "description",
    NULL::numeric(10,2) AS "price",
    NULL::"uuid" AS "category_id",
    NULL::"text" AS "image_url",
    NULL::"text"[] AS "images",
    NULL::"text" AS "sku",
    NULL::integer AS "stock_quantity",
    NULL::integer AS "low_stock_threshold",
    NULL::boolean AS "is_active",
    NULL::boolean AS "is_featured",
    NULL::numeric(8,2) AS "weight",
    NULL::"jsonb" AS "dimensions",
    NULL::"text" AS "meta_title",
    NULL::"text" AS "meta_description",
    NULL::"text"[] AS "tags",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text" AS "category_name",
    NULL::"text" AS "category_slug",
    NULL::"text" AS "category_color",
    NULL::numeric AS "average_rating",
    NULL::bigint AS "review_count";


ALTER TABLE "public"."product_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "title" "text",
    "comment" "text",
    "is_approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."product_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_product_id_key" UNIQUE ("user_id", "product_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_product_id_key" UNIQUE ("user_id", "product_id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_product_id_user_id_key" UNIQUE ("product_id", "user_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_cart_items_user" ON "public"."cart_items" USING "btree" ("user_id");



CREATE INDEX "idx_favorites_product" ON "public"."favorites" USING "btree" ("product_id");



CREATE INDEX "idx_favorites_user" ON "public"."favorites" USING "btree" ("user_id");



CREATE INDEX "idx_inventory_product" ON "public"."inventory_transactions" USING "btree" ("product_id");



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_order" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_created" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_product_reviews_approved" ON "public"."product_reviews" USING "btree" ("is_approved");



CREATE INDEX "idx_product_reviews_product" ON "public"."product_reviews" USING "btree" ("product_id");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("is_active");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_featured" ON "public"."products" USING "btree" ("is_featured");



CREATE OR REPLACE VIEW "public"."product_details" AS
 SELECT "p"."id",
    "p"."name",
    "p"."description",
    "p"."price",
    "p"."category_id",
    "p"."image_url",
    "p"."images",
    "p"."sku",
    "p"."stock_quantity",
    "p"."low_stock_threshold",
    "p"."is_active",
    "p"."is_featured",
    "p"."weight",
    "p"."dimensions",
    "p"."meta_title",
    "p"."meta_description",
    "p"."tags",
    "p"."created_at",
    "p"."updated_at",
    "c"."name" AS "category_name",
    "c"."slug" AS "category_slug",
    "c"."color" AS "category_color",
    COALESCE("avg"("pr"."rating"), (0)::numeric) AS "average_rating",
    "count"("pr"."id") AS "review_count"
   FROM (("public"."products" "p"
     LEFT JOIN "public"."categories" "c" ON (("p"."category_id" = "c"."id")))
     LEFT JOIN "public"."product_reviews" "pr" ON ((("p"."id" = "pr"."product_id") AND ("pr"."is_approved" = true))))
  GROUP BY "p"."id", "c"."name", "c"."slug", "c"."color";



CREATE OR REPLACE VIEW "public"."order_details" AS
 SELECT "o"."id",
    "o"."user_id",
    "o"."order_number",
    "o"."status",
    "o"."total_amount",
    "o"."subtotal",
    "o"."delivery_fee",
    "o"."tax_amount",
    "o"."discount_amount",
    "o"."delivery_address_id",
    "o"."delivery_notes",
    "o"."delivery_date",
    "o"."payment_method",
    "o"."payment_status",
    "o"."payment_reference",
    "o"."notes",
    "o"."created_at",
    "o"."updated_at",
    "up"."full_name" AS "customer_name",
    "up"."email" AS "customer_email",
    "up"."phone" AS "customer_phone",
    "a"."street_address",
    "a"."city",
    "a"."state",
    "a"."postal_code",
    "count"("oi"."id") AS "item_count"
   FROM ((("public"."orders" "o"
     LEFT JOIN "public"."user_profiles" "up" ON (("o"."user_id" = "up"."id")))
     LEFT JOIN "public"."addresses" "a" ON (("o"."delivery_address_id" = "a"."id")))
     LEFT JOIN "public"."order_items" "oi" ON (("o"."id" = "oi"."order_id")))
  GROUP BY "o"."id", "up"."full_name", "up"."email", "up"."phone", "a"."street_address", "a"."city", "a"."state", "a"."postal_code";



CREATE OR REPLACE TRIGGER "set_order_number_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_number"();



CREATE OR REPLACE TRIGGER "update_addresses_updated_at" BEFORE UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cart_items_updated_at" BEFORE UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_reviews_updated_at" BEFORE UPDATE ON "public"."product_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."role" = 'admin'::"public"."user_role") OR ("user_profiles"."role" = 'super_admin'::"public"."user_role"))))));



CREATE POLICY "Admins can manage all messages" ON "public"."messages" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage all notifications" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage all order items" ON "public"."order_items" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage all orders" ON "public"."orders" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage all reviews" ON "public"."product_reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage inventory" ON "public"."inventory_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can read all notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."role" = 'admin'::"public"."user_role") OR ("user_profiles"."role" = 'super_admin'::"public"."user_role"))))));



CREATE POLICY "Admins can update any notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."role" = 'admin'::"public"."user_role") OR ("user_profiles"."role" = 'super_admin'::"public"."user_role")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."role" = 'admin'::"public"."user_role") OR ("user_profiles"."role" = 'super_admin'::"public"."user_role"))))));



CREATE POLICY "Admins can view all addresses" ON "public"."addresses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can view all profiles" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Everyone can view approved reviews" ON "public"."product_reviews" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Public can read active categories" ON "public"."categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read active products" ON "public"."products" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can create own orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own cart" ON "public"."cart_items" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own favorites" ON "public"."favorites" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own cart" ON "public"."cart_items" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own favorites" ON "public"."favorites" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own addresses" ON "public"."addresses" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own reviews" ON "public"."product_reviews" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update own cart" ON "public"."cart_items" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own cart" ON "public"."cart_items" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own favorites" ON "public"."favorites" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_admin_notification"("p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_notification"("p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_notification"("p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" "uuid", "p_delivery_address_id" "uuid", "p_delivery_notes" "text", "p_payment_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" "uuid", "p_delivery_address_id" "uuid", "p_delivery_notes" "text", "p_payment_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" "uuid", "p_delivery_address_id" "uuid", "p_delivery_notes" "text", "p_payment_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_low_stock_products"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_low_stock_products"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_low_stock_products"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_stock"("p_product_id" "uuid", "p_quantity" integer, "p_type" "text", "p_reason" "text", "p_reference_id" "uuid", "p_reference_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_stock"("p_product_id" "uuid", "p_quantity" integer, "p_type" "text", "p_reason" "text", "p_reference_id" "uuid", "p_reference_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_stock"("p_product_id" "uuid", "p_quantity" integer, "p_type" "text", "p_reason" "text", "p_reference_id" "uuid", "p_reference_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_details" TO "anon";
GRANT ALL ON TABLE "public"."order_details" TO "authenticated";
GRANT ALL ON TABLE "public"."order_details" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."product_details" TO "anon";
GRANT ALL ON TABLE "public"."product_details" TO "authenticated";
GRANT ALL ON TABLE "public"."product_details" TO "service_role";



GRANT ALL ON TABLE "public"."product_reviews" TO "anon";
GRANT ALL ON TABLE "public"."product_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."product_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
