import { createClient } from '@supabase/supabase-js'
import type { Database } from '@shared/database.types'

const supabaseUrl = 'https://isgqdllaunoydbjweiwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for auth
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, fullName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut()
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions for user profiles
export const profiles = {
  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Check if user is admin
  isAdmin: async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role === 'admin' || data?.role === 'super_admin'
  }
}

// Helper functions for products
export const products = {
  // Get all products
  getAll: async () => {
    try {
      console.log('🔍 Calling supabase.rpc("get_product_details")...');
      const { data, error } = await supabase
        .rpc('get_product_details')

      console.log('📦 Products RPC Response:', {
        dataLength: data?.length,
        error,
        firstItem: data?.[0]
      });

      if (error) {
        console.error('❌ Products API Error:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('❌ Products fetch error:', err)
      return { data: [], error: err }
    }
  },

  // Get product by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('product_details')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    return { data, error }
  },

  // Search products
  search: async (query: string) => {
    const { data, error } = await supabase
      .from('product_details')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get products by category
  getByCategory: async (categorySlug: string) => {
    const { data, error } = await supabase
      .from('product_details')
      .select('*')
      .eq('is_active', true)
      .eq('category_slug', categorySlug)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Helper functions for categories
export const categories = {
  // Get all categories
  getAll: async () => {
    try {
      console.log('🔍 Calling supabase.from("categories").select...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      console.log('📂 Categories Response:', {
        dataLength: data?.length,
        error,
        firstItem: data?.[0]
      });

      if (error) {
        console.error('❌ Categories API Error:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('❌ Categories fetch error:', err)
      return { data: [], error: err }
    }
  }
}

// Helper functions for cart
export const cart = {
  // Get user's cart
  getCart: async (userId: string) => {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products:product_id (
          id, name, price, image_url, stock_quantity
        )
      `)
      .eq('user_id', userId)
    return { data, error }
  },

  // Add item to cart
  addItem: async (userId: string, productId: string, quantity: number = 1) => {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity
      }, {
        onConflict: 'user_id,product_id'
      })
      .select()
    return { data, error }
  },

  // Update cart item quantity
  updateQuantity: async (userId: string, productId: string, quantity: number) => {
    if (quantity <= 0) {
      return cart.removeItem(userId, productId)
    }
    
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
    return { data, error }
  },

  // Remove item from cart
  removeItem: async (userId: string, productId: string) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
    return { data, error }
  },

  // Clear cart
  clearCart: async (userId: string) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
    return { data, error }
  }
}

// Helper functions for favorites
export const favorites = {
  // Get user's favorites
  getFavorites: async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        products:product_id (
          id, name, price, image_url, category_id
        )
      `)
      .eq('user_id', userId)
    return { data, error }
  },

  // Toggle favorite
  toggleFavorite: async (userId: string, productId: string) => {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Remove favorite
      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
      return { data, error, action: 'removed' }
    } else {
      // Add favorite
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          product_id: productId
        })
        .select()
      return { data, error, action: 'added' }
    }
  }
}

// Helper functions for orders
export const orders = {
  // Get user's orders
  getUserOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from('order_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Create order from cart
  createFromCart: async (userId: string, deliveryAddressId: string, deliveryNotes?: string) => {
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_user_id: userId,
      p_delivery_address_id: deliveryAddressId,
      p_delivery_notes: deliveryNotes
    })
    return { data, error }
  }
}
