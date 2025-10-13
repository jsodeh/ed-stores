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
    } catch (e) {}
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
      console.log('🔍 Fetching products from product_details view...');
      
      let query = publicSupabase
        .from("product_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq('category_slug', category);
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

      // Filter active products on client side
      console.log('🔍 Raw products data before filtering:', data?.length, 'items');
      
      const activeProducts = (data || []).filter(product => {
        const isActive = product.is_active !== false;
        if (!isActive) {
          console.log('🔍 Filtering out inactive product:', product.name, 'is_active:', product.is_active);
        }
        return isActive;
      });
      
      console.log('🔍 Final filtered products:', activeProducts.length, 'items');
      console.log('✅ Active products filtered:', activeProducts.length);
      return { data: activeProducts, error: null };
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
      console.log('🔍 Fetching categories from categories table...');
      
      // Use the publicSupabase client for read operations to avoid auth issues
      const { data, error } = await publicSupabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      
      console.log('🔍 Raw categories query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error("❌ Categories API Error:", error);
        // Don't throw error, return empty array to prevent app crash
        return { data: [], error: normalizeError(error) };
      }

      // Filter active categories on client side
      console.log('🔍 Raw categories data before transformation:', data?.length, 'items');
      
      const activeCategories = (data || []).filter(category => {
        const isActive = category.is_active !== false;
        if (!isActive) {
          console.log('🔍 Filtering out inactive category:', category.name, 'is_active:', category.is_active);
        }
        return isActive;
      });
      
      console.log('🔍 Final transformed categories:', activeCategories.length, 'items');
      console.log('✅ Active categories filtered:', activeCategories.length);
      return { data: activeCategories, error: null };
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
        .single();
      
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
  
  // Update order status (for admin)
  updateOrderStatus: async (orderId: string, status: Database["public"]["Enums"]["order_status"]) => {
    // Determine payment status based on order status
    let paymentStatus = null;
    
    switch (status) {
      case 'confirmed':
      case 'processing':
      case 'shipped':
      case 'delivered':
        // When admin confirms order, it means payment has been received
        paymentStatus = 'completed';
        break;
      case 'cancelled':
        paymentStatus = 'failed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        break;
      default:
        paymentStatus = 'pending';
    }

    // If cancelling order, restore inventory using stored procedure
    if (status === 'cancelled') {
      try {
        // Call the stored procedure to restore inventory
        // Note: This procedure needs to be created in the database
        const { error: restoreError } = await supabase.rpc('restore_order_inventory' as any, {
          p_order_id: orderId
        });
        
        if (restoreError) {
          console.error('Error restoring inventory for cancelled order:', restoreError);
          // Don't fail the status update if inventory restoration fails
        }
      } catch (error) {
        console.error('Error calling restore_order_inventory procedure:', error);
        // Don't fail the status update if inventory restoration fails
      }
    }

    const updateData: any = { 
      status: status as any,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();
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