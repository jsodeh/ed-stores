import type { Database } from "@shared/database.types";
import type { Database } from "@shared/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://isgqdllaunoydbjweiwo.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps";

// Debug: Log what credentials are being used
console.log('🔧 Supabase Configuration Debug:');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
console.log('🌍 Environment variables loaded:', {
  hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  nodeEnv: import.meta.env.NODE_ENV,
  mode: import.meta.env.MODE
});

let supabaseInvalidApiKey = false;

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
    // Detect invalid API key messages and set flag so we can short-circuit further requests
    try {
      const lower = message.toLowerCase();
      if (lower.includes('invalid api key') || lower.includes('invalid key') || lower.includes('api key is invalid')) {
        supabaseInvalidApiKey = true;
        console.error('🔒 Supabase invalid API key detected:', message);
      }
    } catch (e) {}
    return e;
  } catch {
    return new Error(String(err));
  }
}

export { supabaseInvalidApiKey };

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper functions for auth
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
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
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
    const { data } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();
    return data?.role === "admin" || data?.role === "super_admin";
  },
};

// Helper functions for products
export const products = {
  // Get all products
  getAll: async () => {
    try {
      console.log('🔍 Fetching products from products table with category join...');
      
      // Check current session to understand authentication state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Current session:', session ? 'Authenticated' : 'Anonymous');
      
      // Try a simple query first to test connection
      console.log('🧪 Testing basic connection with simple query...');
      const testResult = await supabase
        .from("products")
        .select("id, name")
        .limit(1);
      
      if (testResult.error) {
        console.error('❌ Basic connection test failed:', testResult.error);
        return { data: [], error: normalizeError(testResult.error) };
      }
      
      console.log('✅ Basic connection test passed, proceeding with full query...');
      
      // Now try the full query
      console.log('📋 Attempting full query...');
      const result1 = await supabase
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
      
      console.log('🔍 Raw query result:', result1);
      
      if (!result1.error) {
        data = result1.data;
        error = result1.error;
        console.log('✅ Query without filters succeeded');
      } else {
        console.log('❌ Query without filters failed:', result1.error);
        
        // Check if it's an authentication/permission error
        if (result1.error.message?.includes('401') || 
            result1.error.message?.includes('403') || 
            result1.error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected. This might be due to RLS policies.');
          // Return a specific error that the UI can handle
          return { data: [], error: normalizeError({ ...result1.error, code: 'PERMISSION_DENIED' }) };
        }
        
        // Approach 2: Try with minimal select
        console.log('📋 Attempting minimal query...');
        const result2 = await supabase
          .from("products")
          .select('id, name, price, description, image_url, category_id, is_active')
          .limit(10);
        
        console.log('🔍 Minimal query result:', result2);
        
        if (!result2.error) {
          // If minimal query works, try to get categories separately
          console.log('📋 Fetching categories separately...');
          const { data: categoriesData, error: catError } = await supabase
            .from("categories")
            .select('id, name, slug, color');
          
          console.log('🔍 Categories separate query:', { data: categoriesData, error: catError });
          
          // Manually join the data
          data = result2.data?.map(product => {
            const category = categoriesData?.find(cat => cat.id === product.category_id);
            return {
              ...product,
              categories: category
            };
          });
          error = null;
          console.log('✅ Minimal query with manual join succeeded');
        } else {
          console.log('❌ All query attempts failed');
          // Check if it's an authentication/permission error
          if (result2.error.message?.includes('401') || 
              result2.error.message?.includes('403') || 
              result2.error.message?.includes('permission')) {
            console.warn('🔐 Authentication/Permission error detected in minimal query. This might be due to RLS policies.');
            return { data: [], error: normalizeError({ ...result2.error, code: 'PERMISSION_DENIED' }) };
          }
          data = [];
          error = result2.error;
        }
      }

      console.log('📦 Products query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error("Products API Error:", error);
        
        // Try a simple fallback query
        console.log('🔄 Trying simple fallback query...');
        try {
          const fallbackResult = await supabase
            .from("products")
            .select("*")
            .limit(10);
          
          if (!fallbackResult.error && fallbackResult.data) {
            console.log('✅ Fallback query succeeded:', fallbackResult.data.length, 'items');
            data = fallbackResult.data;
            error = null;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
        }
        
        if (error) {
          // Don't throw error, return empty array to prevent app crash
          return { data: [], error: normalizeError(error) };
        }
      }

      // Transform and filter data on client side
      console.log('🔍 Raw products data before transformation:', data?.length, 'items');
      
      const transformedData = (data || [])
        .filter(product => {
          const isActive = product.is_active !== false;
          if (!isActive) {
            console.log('🔍 Filtering out inactive product:', product.name, 'is_active:', product.is_active);
          }
          return isActive;
        })
        .map(product => {
          const transformed = {
            ...product,
            category_name: product.categories?.name || null,
            category_slug: product.categories?.slug || null,
            category_color: product.categories?.color || null,
            average_rating: 0,
            review_count: 0,
            // Remove nested category object to avoid confusion
            categories: undefined
          };
          console.log('🔍 Transformed product:', product.name, 'category:', transformed.category_name);
          return transformed;
        });
      
      console.log('🔍 Final transformed products:', transformedData.length, 'items');
      
      console.log('✅ Products transformed and filtered:', transformedData.length);
      return { data: transformedData, error: null };
    } catch (err) {
      console.error("Products fetch error:", err);
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
  // Get all categories
  getAll: async () => {
    try {
      console.log('🔍 Fetching categories from categories table...');
      
      // Check current session to understand authentication state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Current session for categories:', session ? 'Authenticated' : 'Anonymous');
      
      // Try a simple query first to test connection
      console.log('🧪 Testing categories connection with simple query...');
      const testResult = await supabase
        .from("categories")
        .select("id, name")
        .limit(1);
      
      if (testResult.error) {
        console.error('❌ Categories connection test failed:', testResult.error);
        return { data: [], error: normalizeError(testResult.error) };
      }
      
      console.log('✅ Categories connection test passed, proceeding with full query...');
      
      // Try multiple approaches
      let data, error;
      
      // Approach 1: Try without any filters
      console.log('📋 Attempting categories query without filters...');
      const result1 = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (!result1.error) {
        data = result1.data;
        error = result1.error;
        console.log('✅ Categories query without filters succeeded');
      } else {
        console.log('❌ Categories query failed:', result1.error);
        
        // Check if it's an authentication/permission error
        if (result1.error.message?.includes('401') || 
            result1.error.message?.includes('403') || 
            result1.error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for categories. This might be due to RLS policies.');
          // Return a specific error that the UI can handle
          return { data: [], error: normalizeError({ ...result1.error, code: 'PERMISSION_DENIED' }) };
        }
        
        // Approach 2: Try with minimal select
        console.log('📋 Attempting minimal categories query...');
        const result2 = await supabase
          .from("categories")
          .select('id, name, slug, color, icon')
          .limit(20);
        
        if (!result2.error) {
          data = result2.data;
          error = null;
          console.log('✅ Minimal categories query succeeded');
        } else {
          console.log('❌ All categories query attempts failed');
          // Check if it's an authentication/permission error
          if (result2.error.message?.includes('401') || 
              result2.error.message?.includes('403') || 
              result2.error.message?.includes('permission')) {
            console.warn('🔐 Authentication/Permission error detected in minimal categories query. This might be due to RLS policies.');
            return { data: [], error: normalizeError({ ...result2.error, code: 'PERMISSION_DENIED' }) };
          }
          data = [];
          error = result2.error;
        }
      }

      console.log('📦 Categories query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error("Categories API Error:", error);
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
      console.error("Categories fetch error:", err);
      return { data: [], error: normalizeError(err) };
    }
  },
};

// Helper functions for cart
export const cart = {
  // Get user's cart
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
      const { data, error } = await supabase
        .from("cart_items")
        .upsert(
          {
            user_id: userId,
            product_id: productId,
            quantity,
          },
          {
            onConflict: "user_id,product_id",
          },
        )
        .select();
      
      if (error) {
        console.error("❌ Cart addItem Error:", error);
        // Check if it's an authentication/permission error
        if (error.message?.includes('401') || 
            error.message?.includes('403') || 
            error.message?.includes('permission')) {
          console.warn('🔐 Authentication/Permission error detected for cart addItem. This might be due to RLS policies.');
          return { data: null, error: normalizeError({ ...error, code: 'PERMISSION_DENIED' }) };
        }
        return { data: null, error: normalizeError(error) };
      }
      
      console.log('✅ Item added to cart successfully');
      return { data, error: null };
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

  // Create order from cart
  createFromCart: async (
    userId: string,
    deliveryAddressId: string,
    deliveryNotes?: string,
  ) => {
    const { data, error } = await supabase.rpc("create_order_from_cart", {
      p_user_id: userId,
      p_delivery_address_id: deliveryAddressId,
      p_delivery_notes: deliveryNotes,
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
