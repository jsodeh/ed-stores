import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/database.types";

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
      
      // Try multiple approaches to get data
      let data, error;
      
      // Approach 1: Try without any filters first
      console.log('📋 Attempting query without filters...');
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
          data = [];
          error = result2.error;
        }
      }

      console.log('📦 Products query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error("Products API Error:", error);
        // Don't throw error, return empty array to prevent app crash
        return { data: [], error };
      }

      // Transform and filter data on client side
      const transformedData = (data || [])
        .filter(product => product.is_active !== false) // Client-side active filter
        .map(product => ({
          ...product,
          category_name: product.categories?.name || null,
          category_slug: product.categories?.slug || null,
          category_color: product.categories?.color || null,
          average_rating: 0,
          review_count: 0
        }));
      
      console.log('✅ Products transformed and filtered:', transformedData.length);
      return { data: transformedData, error: null };
    } catch (err) {
      console.error("Products fetch error:", err);
      return { data: [], error: err };
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
        review_count: 0
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
        review_count: 0
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
        review_count: 0
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
          data = [];
          error = result2.error;
        }
      }

      console.log('📦 Categories query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error("Categories API Error:", error);
        // Don't throw error, return empty array to prevent app crash
        return { data: [], error };
      }

      // Filter active categories on client side
      const activeCategories = (data || []).filter(category => category.is_active !== false);
      console.log('✅ Active categories filtered:', activeCategories.length);
      return { data: activeCategories, error: null };
    } catch (err) {
      console.error("Categories fetch error:", err);
      return { data: [], error: err };
    }
  },
};

// Helper functions for cart
export const cart = {
  // Get user's cart
  getCart: async (userId: string) => {
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

  // Add item to cart
  addItem: async (userId: string, productId: string, quantity: number = 1) => {
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
    return { data, error };
  },

  // Update cart item quantity
  updateQuantity: async (
    userId: string,
    productId: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      return cart.removeItem(userId, productId);
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", productId)
      .select();
    return { data, error };
  },

  // Remove item from cart
  removeItem: async (userId: string, productId: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    return { data, error };
  },

  // Clear cart
  clearCart: async (userId: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
    return { data, error };
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
}
