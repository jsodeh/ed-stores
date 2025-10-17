import type { Database } from "@shared/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log what credentials are being used
console.log('🔧 Supabase Configuration Debug:');
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env vars. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}
console.log('📍 URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('🌍 Environment variables loaded:', {
  hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  nodeEnv: import.meta.env.NODE_ENV,
  mode: import.meta.env.MODE
});

let supabaseInvalidApiKey = false;
let consecutiveErrors = 0;
let lastErrorTime = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
const ERROR_COOLDOWN_MS = 30000; // 30 seconds

function normalizeError(err: any): Error | null {
  if (!err) return null;
  if (err instanceof Error) return err;

  try {
    const parts: string[] = [];
    if (err.message) parts.push(err.message);
    if (err.status) parts.push(`status: ${err.status}`);
    if (err.code) parts.push(`code: ${err.code}`);
    if (err.details) parts.push(`details: ${JSON.stringify(err.details)}`);
    if (parts.length === 0) parts.push(JSON.stringify(err));
    const message = parts.join(' | ');
    const e = new Error(message);
    (e as any).original = err;

    // Circuit breaker pattern - track consecutive errors
    const now = Date.now();
    if (now - lastErrorTime > ERROR_COOLDOWN_MS) {
      consecutiveErrors = 0; // Reset if enough time has passed
    }
    consecutiveErrors++;
    lastErrorTime = now;

    // Detect invalid API key messages and set flag so we can short-circuit further requests
    try {
      const lower = message.toLowerCase();
      if (lower.includes('invalid api key') || lower.includes('invalid key') || lower.includes('api key is invalid')) {
        supabaseInvalidApiKey = true;
        console.error('🔒 Supabase invalid API key detected:', message);
      }

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('🚨 Circuit breaker activated: Too many consecutive errors');
        (e as any).circuitBreakerTripped = true;
      }
    } catch (e) { }
    return e;
  } catch {
    return new Error(String(err));
  }
}

// Helper to check if circuit breaker is active
function isCircuitBreakerActive(): boolean {
  const now = Date.now();
  if (now - lastErrorTime > ERROR_COOLDOWN_MS) {
    consecutiveErrors = 0;
    return false;
  }
  return consecutiveErrors >= MAX_CONSECUTIVE_ERRORS;
}

export { supabaseInvalidApiKey };

// Single Supabase client instance to prevent "Multiple GoTrueClient instances" warning
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Add better error handling for refresh token issues
    debug: import.meta.env.MODE === 'development',
  },
  global: {
    headers: {
      'x-application-origin': 'ed-stores-client'
    }
  }
});

// For public operations, use the same client but with different storage key
export const publicSupabase = supabase;

// Helper functions for auth
// Initial lightweight validation to detect invalid API keys early
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { data, error } = await publicSupabase
        .from('products')
        .select('id')
        .limit(1);
      if (error) {
        normalizeError(error);
      } else {
        console.log('🔍 Supabase initial connectivity check passed');
      }
    } catch (err) {
      normalizeError(err);
    }
  })();
}

export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, fullName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // Get current user
  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  // Get current session
  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper functions for user profiles
export const profiles = {
  // Get user profile
  getProfile: async (userId: string) => {
    console.log('👤 profiles.getProfile: Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    console.log('👤 profiles.getProfile: Result for user', userId, { data, error });
    return { data, error };
  },

  // Get user profile by email
  getProfileByEmail: async (email: string) => {
    console.log('📧 profiles.getProfileByEmail: Fetching profile for email:', email);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .single();
    console.log('📧 profiles.getProfileByEmail: Result for email', email, { data, error });
    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  // Check if user is admin
  isAdmin: async (userId: string) => {
    console.log('🔐 profiles.isAdmin: Checking admin status for user:', userId);
    const { data } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const isAdmin = data?.role === "admin" || data?.role === "super_admin";
    console.log('🔐 profiles.isAdmin: Result for user', userId, { role: data?.role, isAdmin });
    return isAdmin;
  },
};

// Helper functions for products
export const products = {
  // Get all products - optimized for product_details view
  getAll: async ({ category, search }: { category?: string | null, search?: string | null } = {}) => {
    if (supabaseInvalidApiKey) {
      console.error('❌ Products fetch aborted: invalid Supabase API key');
      return { data: [], error: new Error('Invalid Supabase API key configured') };
    }

    if (isCircuitBreakerActive()) {
      console.error('❌ Products fetch aborted: circuit breaker active');
      return { data: [], error: new Error('Service temporarily unavailable. Please try again later.') };
    }

    try {
      console.log('🔍 Fetching products from products table directly...');

      let query = publicSupabase
        .from("products")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category) {
        // First get the category ID
        const { data: categoryData } = await publicSupabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .eq("is_active", true)
          .single();

        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Use the publicSupabase client for read operations to avoid auth issues
      const { data, error } = await query;

      console.log('🔍 Raw products query result:', { data, error, count: data?.length });

      if (error) {
        console.error("❌ Products API Error:", error);
        // Don't throw error, return empty array to prevent app crash
        return { data: [], error: normalizeError(error) };
      }

      // Transform data to match expected structure (like the view)
      console.log('🔍 Raw products data from table:', data?.length, 'items');

      const transformedProducts = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
        category_color: product.categories?.color || null,
        average_rating: 0,
        review_count: 0,
      }));

      console.log('🔍 Transformed products:', transformedProducts.length, 'items');
      console.log('✅ Products fetched from table successfully:', transformedProducts.length);
      return { data: transformedProducts, error: null };
    } catch (err) {
      console.error("❌ Products fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },

  // Get product by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug,
          color
        )
      `)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (data && !error) {
      // Transform data to match the view structure
      const transformedData = {
        ...data,
        category_name: data.categories?.name || null,
        category_slug: data.categories?.slug || null,
        category_color: data.categories?.color || null,
        average_rating: 0,
        review_count: 0,
        // Remove nested category object to avoid confusion
        categories: undefined
      };
      return { data: transformedData, error };
    }

    return { data, error };
  },

  // Search products
  search: async (query: string) => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug,
          color
        )
      `)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (data && !error) {
      // Transform data to match the view structure
      const transformedData = data.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
        category_color: product.categories?.color || null,
        average_rating: 0,
        review_count: 0,
        // Remove nested category object to avoid confusion
        categories: undefined
      }));
      return { data: transformedData, error };
    }

    return { data, error };
  },

  // Get products by category
  getByCategory: async (categorySlug: string) => {
    // First get the category ID
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single();

    if (!category) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug,
          color
        )
      `)
      .eq("is_active", true)
      .eq("category_id", category.id)
      .order("created_at", { ascending: false });

    if (data && !error) {
      // Transform data to match the view structure
      const transformedData = data.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
        category_color: product.categories?.color || null,
        average_rating: 0,
        review_count: 0,
        // Remove nested category object to avoid confusion
        categories: undefined
      }));
      return { data: transformedData, error };
    }

    return { data, error };
  },
};

// Helper functions for categories
export const categories = {
  // Get all categories - original version with fixes
  getAll: async () => {
    if (supabaseInvalidApiKey) {
      console.error('❌ Categories fetch aborted: invalid Supabase API key');
      return { data: [], error: new Error('Invalid Supabase API key configured') };
    }

    if (isCircuitBreakerActive()) {
      console.error('❌ Categories fetch aborted: circuit breaker active');
      return { data: [], error: new Error('Service temporarily unavailable. Please try again later.') };
    }

    try {
      console.log('🔍 Fetching categories from categories table directly...');

      // Use the publicSupabase client for read operations to avoid auth issues
      const { data, error } = await publicSupabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      console.log('🔍 Raw categories query result:', { data, error, count: data?.length });

      if (error) {
        console.error("❌ Categories API Error:", error);
        // Don't throw error, return empty array to prevent app crash
        return { data: [], error: normalizeError(error) };
      }

      // Categories are already filtered by is_active = true in the query
      console.log('🔍 Raw categories data from table:', data?.length, 'items');
      console.log('✅ Categories fetched from table successfully:', data?.length);
      return { data: data || [], error: null };
    } catch (err) {
      console.error("❌ Categories fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },
};

// Helper functions for cart
export const cart = {
  // Get user's cart - simplified version
  getCart: async (userId: string) => {
    try {
      console.log('🛒 Fetching cart for user:', userId);
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          *,
          products:product_id (
            *,
            categories:category_id (
              id,
              name,
              slug,
              color
            )
          )
        `,
        )
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Cart API Error:", error);
        // Check if it's an authentication/permission error
        if (error.message?.includes('401') ||
          error.message?.includes('403') ||
          error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for cart. This might be due to RLS policies.');
          return { data: [], error: { ...error, code: 'PERMISSION_DENIED' } };
        }
        return { data: [], error: normalizeError(error) };
      }

      if (data) {
        // Transform data to match the expected structure
        const transformedData = data.map(item => ({
          ...item,
          products: {
            ...item.products,
            category_name: item.products?.categories?.name || null,
            category_slug: item.products?.categories?.slug || null,
            category_color: item.products?.categories?.color || null,
            average_rating: 0,
            review_count: 0,
            // Remove the nested categories object
            categories: undefined
          }
        })).filter(item => item.products); // Filter out items without products

        console.log('✅ Cart fetched successfully:', transformedData.length, 'items');
        console.log('📦 Raw cart data:', data);
        console.log('🔄 Transformed cart data:', transformedData);
        return { data: transformedData, error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("❌ Cart fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },

  // Add item to cart
  addItem: async (userId: string, productId: string, quantity: number = 1) => {
    try {
      console.log('🛒 Adding item to cart:', { userId, productId, quantity });

      // First check if item already exists
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        const { data, error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("user_id", userId)
          .eq("product_id", productId)
          .select();

        if (error) {
          console.error("❌ Cart addItem (update) Error:", error);
          if (error.message?.includes('401') ||
            error.message?.includes('403') ||
            error.message?.includes('permission')) {
            console.warn('🔐 Authentication/Permission error detected for cart addItem (update). This might be due to RLS policies.');
            return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
          }
          return { data: null, error: normalizeError(error) };
        }

        console.log('✅ Item quantity updated in cart successfully');
        console.log('📦 Updated cart item data:', data);
        return { data, error: null };
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: userId,
            product_id: productId,
            quantity,
          })
          .select();

        if (error) {
          console.error("❌ Cart addItem (insert) Error:", error);
          // Check if it's an authentication/permission error
          if (error.message?.includes('401') ||
            error.message?.includes('403') ||
            error.message?.includes('permission')) {
            console.warn('🔐 Authentication/Permission error detected for cart addItem (insert). This might be due to RLS policies.');
            return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
          }
          return { data: null, error: normalizeError(error) };
        }

        console.log('✅ Item added to cart successfully');
        console.log('📦 Added cart item data:', data);
        return { data, error: null };
      }
    } catch (err) {
      console.error("❌ Cart addItem error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Update cart item quantity
  updateQuantity: async (
    userId: string,
    productId: string,
    quantity: number,
  ) => {
    try {
      if (quantity <= 0) {
        return cart.removeItem(userId, productId);
      }

      console.log('🛒 Updating cart item quantity:', { userId, productId, quantity });
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", userId)
        .eq("product_id", productId)
        .select();

      if (error) {
        console.error("❌ Cart updateQuantity Error:", error);
        // Check if it's an authentication/permission error
        if (error.message?.includes('401') ||
          error.message?.includes('403') ||
          error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for cart updateQuantity. This might be due to RLS policies.');
          return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
        }
        return { data: null, error: normalizeError(error) };
      }

      console.log('✅ Cart item quantity updated successfully');
      console.log('📦 Updated cart item data:', data);
      return { data, error: null };
    } catch (err) {
      console.error("❌ Cart updateQuantity error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Remove item from cart
  removeItem: async (userId: string, productId: string) => {
    try {
      console.log('🛒 Removing item from cart:', { userId, productId });
      const { data, error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        console.error("❌ Cart removeItem Error:", error);
        // Check if it's an authentication/permission error
        if (error.message?.includes('401') ||
          error.message?.includes('403') ||
          error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for cart removeItem. This might be due to RLS policies.');
          return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
        }
        return { data: null, error: normalizeError(error) };
      }

      console.log('✅ Item removed from cart successfully');
      console.log('📦 Removed cart item data:', data);
      return { data, error: null };
    } catch (err) {
      console.error("❌ Cart removeItem error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Clear cart
  clearCart: async (userId: string) => {
    try {
      console.log('🛒 Clearing cart for user:', userId);
      const { data, error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Cart clearCart Error:", error);
        // Check if it's an authentication/permission error
        if (error.message?.includes('401') ||
          error.message?.includes('403') ||
          error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for cart clearCart. This might be due to RLS policies.');
          return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
        }
        return { data: null, error: normalizeError(error) };
      }

      console.log('✅ Cart cleared successfully');
      return { data, error: null };
    } catch (err) {
      console.error("❌ Cart clearCart error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },
};

// Helper functions for favorites
export const favorites = {
  // Get user's favorites
  getFavorites: async (userId: string) => {
    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        *,
        products:product_id (
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        )
      `,
      )
      .eq("user_id", userId);

    if (data && !error) {
      // Transform data to match the expected structure
      const transformedData = data.map(item => ({
        ...item,
        products: {
          ...item.products,
          category_name: item.products?.categories?.name || null,
          category_slug: item.products?.categories?.slug || null,
          category_color: item.products?.categories?.color || null,
          average_rating: 0,
          review_count: 0,
          // Remove the nested categories object
          categories: undefined
        }
      })).filter(item => item.products); // Filter out items without products
      return { data: transformedData, error };
    }

    return { data: data || [], error };
  },

  // Toggle favorite
  toggleFavorite: async (userId: string, productId: string) => {
    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existing) {
      // Remove favorite
      const { data, error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
      return { data, error, action: "removed" };
    } else {
      // Add favorite
      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: userId,
          product_id: productId,
        })
        .select();
      return { data, error, action: "added" };
    }
  },
};

// Helper functions for orders
export const orders = {
  // Get user's orders
  getUserOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from("order_details")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  // Get order details by ID
  getOrderById: async (orderId: string, userId: string) => {
    const { data, error } = await supabase
      .from("order_details")
      .select(`
        *,
        order_items:order_items(
          *,
          products:product_id (
            id,
            name,
            image_url,
            price
          )
        )
      `)
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();
    return { data, error };
  },

  // Get order items
  getOrderItems: async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        products:product_id (
          id,
          name,
          image_url
        )
      `)
      .eq("order_id", orderId);
    return { data, error };
  },

  // Create order from cart
  createFromCart: async (
    userId: string,
    deliveryAddressId: string,
    deliveryNotes?: string,
    paymentMethod?: string,
  ) => {
    const { data, error } = await supabase.rpc("create_order_from_cart", {
      p_user_id: userId,
      p_delivery_address_id: deliveryAddressId,
      p_delivery_notes: deliveryNotes,
      p_payment_method: paymentMethod,
    });
    return { data, error };
  },


};

// Helper functions for notifications
export const notifications = {
  // Get user's notifications
  getUserNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  // Get admin notifications (for admin users)
  getAdminNotifications: async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    return { data, error };
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single();
    return { data, error };
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    return { data, error };
  },

  // Create notification for a specific user
  createNotification: async (
    userId: string,
    title: string,
    message: string,
    type?: string,
    actionUrl?: string
  ) => {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl
      })
      .select()
      .single();
    return { data, error };
  },

  // Create admin notification for all admins
  createAdminNotification: async (
    title: string,
    message: string,
    type?: string,
    actionUrl?: string
  ) => {
    const { error } = await supabase.rpc("create_admin_notification", {
      p_title: title,
      p_message: message,
      p_type: type,
      p_action_url: actionUrl
    });
    return { data: null, error: normalizeError(error) };
  },
};

// Admin-specific helper functions
export const admin = {
  // Get all products for admin (includes inactive products)
  getAllProducts: async () => {
    try {
      console.log('🔍 Admin: Fetching all products...');
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Admin products fetch error:", error);
        return { data: [], error: normalizeError(error) };
      }

      // Transform data to match expected structure
      const transformedData = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
        category_color: product.categories?.color || null,
        average_rating: 0,
        review_count: 0,
      }));

      console.log('✅ Admin products fetched successfully:', transformedData.length);
      return { data: transformedData, error: null };
    } catch (err) {
      console.error("❌ Admin products fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },

  // Get product by ID for admin
  getProductById: async (id: string) => {
    try {
      console.log('🔍 Admin: Fetching product by ID:', id);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Admin product fetch error:", error);
        return { data: null, error: normalizeError(error) };
      }

      if (data) {
        // Transform data to match expected structure
        const transformedData = {
          ...data,
          category_name: data.categories?.name || null,
          category_slug: data.categories?.slug || null,
          category_color: data.categories?.color || null,
          average_rating: 0,
          review_count: 0,
        };
        console.log('✅ Admin product fetched successfully:', transformedData.id);
        return { data: transformedData, error: null };
      }

      return { data: null, error: new Error('Product not found') };
    } catch (err) {
      console.error("❌ Admin product fetch error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Create new product
  createProduct: async (productData: any) => {
    try {
      console.log('➕ Admin: Creating new product:', productData);

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `);

      if (error) {
        console.error("❌ Admin product creation error:", error);
        return { data: null, error: normalizeError(error) };
      }

      if (!data || data.length === 0) {
        return { data: null, error: new Error("Product creation failed. No data returned.") };
      }

      // Transform data to match expected structure
      const transformedData = {
        ...data[0],
        category_name: data[0].categories?.name || null,
        category_slug: data[0].categories?.slug || null,
        category_color: data[0].categories?.color || null,
        average_rating: 0,
        review_count: 0,
      };

      console.log('✅ Admin product created successfully:', transformedData.id);
      return { data: transformedData, error: null };
    } catch (err) {
      console.error("❌ Admin product creation error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Update existing product
  updateProduct: async (id: string, productData: any) => {
    try {
      console.log('✏️ Admin: Updating product:', id, productData);

      // Validate the product data before update
      console.log('🔍 Admin: Validating product data...');
      console.log('🔍 Admin: Product data keys:', Object.keys(productData));
      console.log('🔍 Admin: Product data values:', Object.values(productData));

      // Check for potential constraint violations
      if (productData.sku) {
        console.log('🔍 Admin: Checking SKU uniqueness for:', productData.sku);
        const { data: existingSKU } = await supabase
          .from("products")
          .select("id")
          .eq("sku", productData.sku)
          .neq("id", id)
          .single();

        if (existingSKU) {
          console.error('❌ Admin: SKU already exists:', productData.sku);
          return { data: null, error: new Error(`SKU "${productData.sku}" already exists. Please use a different SKU.`) };
        }
      }

      // Check if category exists
      if (productData.category_id) {
        console.log('🔍 Admin: Checking category exists:', productData.category_id);
        const { data: existingCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("id", productData.category_id)
          .single();

        if (!existingCategory) {
          console.error('❌ Admin: Category does not exist:', productData.category_id);
          return { data: null, error: new Error(`Category does not exist. Please select a valid category.`) };
        }
      }

      // First check if the product exists and get current data
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (checkError) {
        console.error("❌ Admin: Error checking product existence:", checkError);
        return { data: null, error: normalizeError(checkError) };
      }

      if (!existingProduct) {
        console.error("❌ Admin: Product not found for update:", id);
        return { data: null, error: new Error("Product not found. It may have been deleted by another user.") };
      }

      console.log('✅ Admin: Product exists, current data:', existingProduct);

      // For admin users, try using the service role or bypass RLS if possible
      console.log('🔧 Admin: Attempting update with admin privileges...');

      // Try the update and get the result
      const { data: updateResult, error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id)
        .select("id");

      console.log('🔍 Admin: Update result:', { updateResult, updateError, affectedRows: updateResult?.length });

      if (updateError) {
        console.error("❌ Admin product update error:", updateError);
        return { data: null, error: normalizeError(updateError) };
      }

      // Check if any rows were actually updated
      if (!updateResult || updateResult.length === 0) {
        console.error("❌ Admin: No rows were updated. Trying alternative approach...");

        // Try updating field by field to identify which field is causing the issue
        console.log('🔧 Admin: Trying field-by-field update to identify the issue...');

        const fieldsToUpdate = Object.keys(productData);
        console.log('🔧 Admin: Fields to update:', fieldsToUpdate);

        // Try updating just the name first (most basic field)
        const { data: nameUpdateResult, error: nameUpdateError } = await supabase
          .from("products")
          .update({ name: productData.name })
          .eq("id", id)
          .select("id");

        console.log('🔧 Admin: Name update test:', { nameUpdateResult, nameUpdateError });

        if (nameUpdateError || !nameUpdateResult || nameUpdateResult.length === 0) {
          // RLS is completely blocking updates for this product
          // This is a database configuration issue that needs to be fixed
          console.error('🚨 Admin: RLS policies are completely blocking updates for this product');
          console.error('🚨 Admin: This requires database-level RLS policy adjustment');
          console.error('🚨 Admin: Product ID:', id);
          console.error('🚨 Admin: User role: super_admin');

          return {
            data: null,
            error: new Error(`Database RLS policies are blocking all product updates. This is a configuration issue that needs to be fixed in Supabase. Product ID: ${id}. Please check the RLS policies on the products table.`)
          };
        }

        // If name update worked, try updating all fields one by one
        console.log('🔧 Admin: Name update worked, trying full update with RLS bypass...');

        // Try the full update again, but this time log each field
        for (const [key, value] of Object.entries(productData)) {
          console.log(`🔧 Admin: Updating field ${key}:`, value);
        }

        return {
          data: null,
          error: new Error(`RLS policies are preventing the full product update. Basic updates work but complex updates are blocked. This requires database-level RLS policy adjustment.`)
        };
      }

      // Now fetch the updated product with relationships
      const { data: updatedProduct, error: fetchError } = await supabase
        .from("products")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("❌ Admin: Error fetching updated product:", fetchError);
        return { data: null, error: normalizeError(fetchError) };
      }

      if (!updatedProduct) {
        return { data: null, error: new Error("Product was updated but could not be retrieved.") };
      }

      // Transform data to match expected structure
      const transformedData = {
        ...updatedProduct,
        category_name: updatedProduct.categories?.name || null,
        category_slug: updatedProduct.categories?.slug || null,
        category_color: updatedProduct.categories?.color || null,
        average_rating: 0,
        review_count: 0,
      };

      console.log('✅ Admin product updated successfully:', transformedData.id);
      return { data: transformedData, error: null };
    } catch (err) {
      console.error("❌ Admin product update error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Delete product
  deleteProduct: async (id: string) => {
    try {
      console.log('🗑️ Admin: Deleting product:', id);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Admin product deletion error:", error);
        return { data: null, error: normalizeError(error) };
      }

      console.log('✅ Admin product deleted successfully:', id);
      return { data: { id }, error: null };
    } catch (err) {
      console.error("❌ Admin product deletion error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Test database connection and permissions
  testConnection: async () => {
    try {
      console.log('🔍 Admin: Testing database connection and permissions...');

      // Test 1: Basic read access
      const { data: products, error: readError } = await supabase
        .from("products")
        .select("id, name")
        .limit(1);

      console.log('📖 Admin: Read test result:', { products, readError });

      if (readError) {
        return { success: false, error: `Read test failed: ${readError.message}` };
      }

      // Test 2: Get current user and role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Admin: Current user:', user?.id);

      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log('🔐 Admin: User role:', profile?.role);

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
          return { success: false, error: `Insufficient permissions. User role: ${profile?.role}` };
        }
      }

      // Test 3: Try a simple update on the first product
      if (products && products.length > 0) {
        const testProductId = products[0].id;
        console.log('✏️ Admin: Testing update on product:', testProductId);

        const { data: updateResult, error: updateError } = await supabase
          .from("products")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", testProductId);

        console.log('✏️ Admin: Update test result:', { updateResult, updateError });

        if (updateError) {
          return { success: false, error: `Update test failed: ${updateError.message}` };
        }
      }

      return { success: true, message: 'All tests passed' };
    } catch (err) {
      console.error("❌ Admin: Connection test error:", err);
      return { success: false, error: `Connection test failed: ${err}` };
    }
  },

  // Get all categories for admin
  getAllCategories: async () => {
    try {
      console.log('📂 Admin: Fetching all categories...');
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("❌ Admin categories fetch error:", error);
        return { data: [], error: normalizeError(error) };
      }

      console.log('✅ Admin categories fetched successfully:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (err) {
      console.error("❌ Admin categories fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },

  // Get all orders for admin
  getAllOrders: async () => {
    try {
      console.log('📊 Admin: Fetching all orders...');
      const { data, error } = await supabase
        .from("order_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Admin orders fetch error:", error);
        return { data: [], error: normalizeError(error) };
      }

      console.log('✅ Admin orders fetched successfully:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (err) {
      console.error("❌ Admin orders fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },

  // Get order by ID for admin
  getOrderById: async (id: string) => {
    try {
      console.log('📊 Admin: Fetching order by ID:', id);
      const { data, error } = await supabase
        .from("order_details")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Admin order fetch error:", error);
        return { data: null, error: normalizeError(error) };
      }

      console.log('✅ Admin order fetched successfully:', data?.id);
      return { data, error: null };
    } catch (err) {
      console.error("❌ Admin order fetch error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      console.log('📊 Admin: Updating order status:', orderId, status);

      // Try using RPC first (in case there's a stored procedure)
      try {
        console.log('📊 Admin: Attempting RPC update_order_status...');
        const { data: rpcData, error: rpcError } = await (supabase as any)
          .rpc('update_order_status', {
            order_id: orderId,
            new_status: status
          });

        if (!rpcError) {
          console.log('✅ Admin order status updated via RPC:', rpcData);
          return { data: { id: orderId, status }, error: null };
        }

        console.log('📊 Admin: RPC error:', rpcError, 'trying direct update...');
      } catch (rpcErr) {
        console.log('📊 Admin: RPC failed:', rpcErr, 'trying direct update...');
      }

      // Fallback to direct table update
      const { data, error } = await supabase
        .from("orders")
        .update({
          status: status,
        })
        .eq("id", orderId)
        .select();

      if (error) {
        console.error("❌ Admin order status update error:", error);

        // If it's a permission error, try with service role approach
        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          console.log('📊 Admin: Permission error detected, this might be an RLS policy issue');
          return { data: null, error: new Error("Permission denied. Admin user may not have proper permissions to update orders. Please check RLS policies.") };
        }

        return { data: null, error: normalizeError(error) };
      }

      if (!data || data.length === 0) {
        return { data: null, error: new Error("No order was updated. The order may have been deleted.") };
      }

      console.log('✅ Admin order status updated successfully:', data[0]);
      return { data: data[0], error: null };
    } catch (err) {
      console.error("❌ Admin order status update error:", err);
      return { data: null, error: normalizeError(err) };
    }
  },
};

// Expose to global scope for debugging (after all objects are defined)
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).products = products;
  (window as any).categories = categories;
  (window as any).cart = cart;
  (window as any).favorites = favorites;
  (window as any).orders = orders;
  (window as any).auth = auth;
  (window as any).profiles = profiles;
  (window as any).notifications = notifications;
}