import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, products, categories, cart, favorites } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Product, Category, CartItem } from '@shared/database.types';

// Import test utility in development
if (import.meta.env.DEV) {
  import('@/lib/test-api');
}

interface CartItemWithProduct extends CartItem {
  products: Product;
}

interface StoreContextType {
  // Data
  products: Product[];
  categories: Category[];
  cartItems: CartItemWithProduct[];
  favoriteProducts: Product[];
  
  // Loading states
  loading: boolean;
  cartLoading: boolean;
  
  // Search and filters
  searchQuery: string;
  selectedCategory: string | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  refreshProducts: () => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Favorites actions
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  // Computed values
  filteredProducts: Product[];
  cartTotal: number;
  cartItemCount: number;
  deliveryFee: number;
  finalTotal: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load user-specific data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
      refreshFavorites();
    } else {
      setCartItems([]);
      setFavoriteProducts([]);
    }
  }, [isAuthenticated, user]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to product changes
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => refreshProducts()
      )
      .subscribe();

    // Subscribe to cart changes for current user
    let cartSubscription: any = null;
    if (user) {
      cartSubscription = supabase
        .channel('cart_changes')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => refreshCart()
        )
        .subscribe();
    }

    return () => {
      productsSubscription.unsubscribe();
      if (cartSubscription) {
        cartSubscription.unsubscribe();
      }
    };
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshProducts(),
        refreshCategories()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const { data, error } = await products.getAll();
      if (error) {
        console.error('Error loading products - Details:', JSON.stringify(error, null, 2));
        throw error;
      }
      setProductsData(data || []);
    } catch (error) {
      console.error('Error loading products - Full error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const refreshCategories = async () => {
    try {
      const { data, error } = await categories.getAll();
      if (error) {
        console.error('Error loading categories - Details:', JSON.stringify(error, null, 2));
        throw error;
      }
      setCategoriesData(data || []);
    } catch (error) {
      console.error('Error loading categories - Full error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const refreshCart = async () => {
    if (!user) return;
    
    setCartLoading(true);
    try {
      const { data, error } = await cart.getCart(user.id);
      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const refreshFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await favorites.getFavorites(user.id);
      if (error) throw error;
      const favoriteProducts = data?.map(fav => fav.products).filter(Boolean) || [];
      setFavoriteProducts(favoriteProducts as Product[]);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Cart actions
  const addToCart = async (product: Product, quantity = 1) => {
    if (!user) {
      // Handle guest user - could show login modal
      console.log('Please sign in to add items to cart');
      return;
    }

    try {
      const { error } = await cart.addItem(user.id, product.id!, quantity);
      if (error) throw error;
      // Cart will be refreshed by real-time subscription
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      const { error } = await cart.updateQuantity(user.id, productId, quantity);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await cart.removeItem(user.id, productId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await cart.clearCart(user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Favorites actions
  const toggleFavorite = async (productId: string) => {
    if (!user) {
      console.log('Please sign in to manage favorites');
      return;
    }

    try {
      const { error } = await favorites.toggleFavorite(user.id, productId);
      if (error) throw error;
      await refreshFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (productId: string) => {
    return favoriteProducts.some(product => product.id === productId);
  };

  // Computed values
  const filteredProducts = productsData.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = product.name?.toLowerCase().includes(query);
      const matchesDescription = product.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) return false;
    }

    // Category filter
    if (selectedCategory) {
      return product.category_slug === selectedCategory;
    }

    return true;
  });

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.products?.price || 0) * item.quantity;
  }, 0);

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const deliveryFee = cartTotal >= 50000 ? 0 : 2500;
  const finalTotal = cartTotal + deliveryFee;

  const value: StoreContextType = {
    // Data
    products: productsData,
    categories: categoriesData,
    cartItems,
    favoriteProducts,
    
    // Loading states
    loading,
    cartLoading,
    
    // Search and filters
    searchQuery,
    selectedCategory,
    
    // Actions
    setSearchQuery,
    setSelectedCategory,
    refreshProducts,
    refreshCart,
    refreshFavorites,
    
    // Cart actions
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    
    // Favorites actions
    toggleFavorite,
    isFavorite,
    
    // Computed values
    filteredProducts,
    cartTotal,
    cartItemCount,
    deliveryFee,
    finalTotal,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
