import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  supabase,
  products,
  categories,
  cart,
  favorites,
  notifications,
} from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { Product, Category, CartItem } from "@shared/database.types";
import { useToast } from "@/hooks/use-toast";

interface CartItemWithProduct extends CartItem {
  products: Product | null;
}

interface GuestCartItem {
  productId: string;
  quantity: number;
  product: Product;
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
  transferGuestCart: () => Promise<void>;

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
  const { user, isAuthenticated, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Simple data loading - load products and categories
  useEffect(() => {
    console.log('🔄 StoreContext: Data loading useEffect triggered');
    
    const loadInitialData = async () => {
      console.log('🚀 StoreContext: Loading initial data');
      setLoading(true);
      
      try {
        // Load products and categories in parallel
        console.log('🔍 StoreContext: Loading products and categories');
        const [productsResult, categoriesResult] = await Promise.all([
          products.getAll(),
          categories.getAll()
        ]);
        
        console.log('📦 StoreContext: Products loaded:', productsResult?.data?.length || 0);
        console.log('📦 StoreContext: Categories loaded:', categoriesResult?.data?.length || 0);
        
        if (productsResult.error) {
          console.error('❌ StoreContext: Error loading products:', productsResult.error);
          setProductsData([]);
        } else {
          setProductsData(productsResult.data || []);
        }
        
        if (categoriesResult.error) {
          console.error('❌ StoreContext: Error loading categories:', categoriesResult.error);
          setCategoriesData([]);
        } else {
          setCategoriesData(categoriesResult.data || []);
        }
        
        console.log('✅ StoreContext: All initial data loaded');
      } catch (error) {
        console.error('❌ StoreContext: Error in loadInitialData:', error);
        setProductsData([]);
        setCategoriesData([]);
      } finally {
        console.log('🏁 StoreContext: Setting loading to false');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Reload data when authentication state changes
  useEffect(() => {
    console.log('🔄 StoreContext: Authentication state changed', { isAuthenticated, userId: user?.id });
    
    // When authentication state changes, refresh user-specific data
    if (isAuthenticated && user) {
      console.log('🔄 StoreContext: User authenticated, refreshing user data');
      refreshCart();
      refreshFavorites();
    } else if (!isAuthenticated) {
      // Clear user-specific data when user logs out
      console.log('🔄 StoreContext: User logged out, clearing user data');
      setCartItems([]);
      setFavoriteProducts([]);
    }
  }, [isAuthenticated, user]);

  // Load guest cart from localStorage on initial load
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem("guestCart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setGuestCart(parsedCart);
        } catch (e) {
          console.error("Error parsing guest cart", e);
        }
      }
    }
  }, []);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    if (!isAuthenticated && guestCart.length > 0) {
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
    }
  }, [guestCart, isAuthenticated]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 StoreContext State Update:', {
      productsCount: productsData.length,
      categoriesCount: categoriesData.length,
      loading,
      hasConnectionError
    });
  }, [productsData, categoriesData, loading, hasConnectionError]);

  // Transfer guest cart to user cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user && guestCart.length > 0) {
      console.log('🛒 StoreContext: User signed in with guest cart, transferring items');
      // Remove the artificial delay - let the transfer happen immediately
      transferGuestCart();
    }
  }, [isAuthenticated, user, guestCart]);

  // Real-time subscriptions
  useEffect(() => {
    // Only subscribe to real-time if we have a session and are authenticated
    // This prevents WebSocket connection errors
    if (!isAuthenticated) {
      return;
    }

    // Subscribe to product changes
    const productsSubscription = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // Refresh products when changes occur
          refreshProducts();
        },
      )
      .subscribe((status) => {
        console.log('📡 Products subscription status:', status);
      });

    // Subscribe to cart changes for current user
    let cartSubscription: any = null;
    if (user) {
      cartSubscription = supabase
        .channel("cart_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🛒 Cart change detected:', payload);
            // Remove the artificial delay - refresh immediately
            refreshCart();
          },
        )
        .subscribe((status) => {
          console.log('📡 Cart subscription status:', status);
        });
    }

    return () => {
      console.log('🧹 Unsubscribing from real-time channels');
      productsSubscription.unsubscribe();
      if (cartSubscription) {
        cartSubscription.unsubscribe();
      }
    };
  }, [user, isAuthenticated]);

  const refreshProducts = async () => {
    try {
      console.log('🔍 StoreContext: Refreshing products');
      // Don't set hasConnectionError to false here as it might hide persistent issues
      const { data, error } = await products.getAll();
      console.log('📦 StoreContext: Products query response:', { data, error, count: data?.length });
      
      if (error) {
        console.error("❌ StoreContext: Error loading products:", error);
        // Check if it's an authentication error
        if (error.message?.includes('401') || error.message?.includes('authentication') || error.message?.includes('403') || error.code === 'PERMISSION_DENIED') {
          console.warn("🔐 StoreContext: Authentication/Permission error for products. This might be due to RLS policies.");
          setHasConnectionError(true);
          toast({
            title: "Access Denied",
            description: "You don't have permission to view products. Please contact support.",
            variant: "destructive",
          });
        }
        // Set empty array on error to avoid infinite loading
        setProductsData([]);
        return;
      }
      
      console.log('✅ StoreContext: Setting products data:', data?.length || 0, 'products');
      setProductsData(data || []);
      // Reset connection error state when successful
      setHasConnectionError(false);
    } catch (error) {
      console.error("❌ StoreContext: Exception in refreshProducts:", error);
      setHasConnectionError(true);
      // Set empty array on error to avoid infinite loading
      setProductsData([]);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshCategories = async () => {
    try {
      console.log('🔍 StoreContext: Refreshing categories');
      const { data, error } = await categories.getAll();
      console.log('📦 StoreContext: Categories query response:', { data, error, count: data?.length });
      
      if (error) {
        console.error("❌ StoreContext: Error loading categories:", error);
        // Check if it's an authentication error
        if (error.message?.includes('401') || error.message?.includes('authentication') || error.message?.includes('403') || error.code === 'PERMISSION_DENIED') {
          console.warn("🔐 StoreContext: Authentication/Permission error for categories. This might be due to RLS policies.");
          toast({
            title: "Access Denied",
            description: "You don't have permission to view categories. Please contact support.",
            variant: "destructive",
          });
        }
        // Set empty array on error to avoid infinite loading
        setCategoriesData([]);
        return;
      }
      
      console.log('✅ StoreContext: Setting categories data:', data?.length || 0, 'categories');
      setCategoriesData(data || []);
    } catch (error) {
      console.error("❌ StoreContext: Exception in refreshCategories:", error);
      // Set empty array on error to avoid infinite loading
      setCategoriesData([]);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshCart = async () => {
    if (!user) return;

    setCartLoading(true);
    try {
      console.log('🛒 StoreContext: Refreshing cart for user', user.id);
      const { data, error } = await cart.getCart(user.id);
      if (error) {
        console.error("❌ StoreContext: Error loading cart:", error);
        if (error.code === 'PERMISSION_DENIED') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access your cart. Please contact support.",
            variant: "destructive",
          });
        }
        // Don't throw error to prevent infinite loading loops
        setCartItems([]);
        return;
      }
      console.log('✅ StoreContext: Cart refreshed with', data?.length || 0, 'items');
      console.log('📦 Cart data:', data);
      setCartItems((data || []) as CartItemWithProduct[]);
    } catch (error) {
      console.error("❌ StoreContext: Exception in refreshCart:", error);
      toast({
        title: "Error",
        description: "Failed to load your cart. Please try again.",
        variant: "destructive",
      });
      // Set empty array on error to avoid infinite loading
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  };

  const refreshFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await favorites.getFavorites(user.id);
      if (error) {
        console.error("Error loading favorites:", error);
        // Set empty array on error to avoid issues
        setFavoriteProducts([]);
        return;
      }
      const favoriteProducts =
        data?.map((fav) => fav.products).filter(Boolean) || [];
      setFavoriteProducts(favoriteProducts as Product[]);
    } catch (error) {
      console.error("Error loading favorites:", error);
      // Set empty array on error to avoid issues
      setFavoriteProducts([]);
    }
  };

  // Transfer guest cart items to user's cart when they log in
  const transferGuestCart = async () => {
    if (!user || guestCart.length === 0) {
      console.log('🛒 StoreContext: No guest cart to transfer or user not authenticated');
      return;
    }

    try {
      console.log('🛒 StoreContext: Transferring', guestCart.length, 'items from guest cart to user cart');
      
      // First, ensure user's cart is loaded
      await refreshCart();
      
      // Store the original guest cart length for the notification
      const originalGuestCartLength = guestCart.length;
      
      // Add each guest cart item to the user's cart
      for (const item of guestCart) {
        const { error } = await cart.addItem(user.id, item.productId, item.quantity);
        if (error) {
          console.error("❌ StoreContext: Error adding item to cart during transfer:", error);
          if (error.code === 'PERMISSION_DENIED') {
            toast({
              title: "Access Denied",
              description: "You don't have permission to add items to your cart. Please contact support.",
              variant: "destructive",
            });
            return;
          }
          // Don't throw error, just log it and continue with other items
          console.warn("⚠️ StoreContext: Skipping item due to error:", item.productId);
          continue;
        }
      }
      
      // Clear guest cart regardless of individual item success
      setGuestCart([]);
      localStorage.removeItem("guestCart");
      
      // Refresh user's cart
      await refreshCart();
      
      toast({
        title: "Cart transferred",
        description: "Your guest cart items have been added to your account",
      });
      
      // Send notification to admins (only if we have profile data)
      try {
        await notifications.createAdminNotification(
          "User Cart Transferred",
          `User ${profile?.full_name || user.email} transferred ${originalGuestCartLength} items from guest cart to account`,
          "cart"
        );
      } catch (notificationError) {
        console.warn("⚠️ StoreContext: Failed to send admin notification:", notificationError);
        // Don't fail the entire transfer for notification errors
      }
    } catch (error) {
      console.error("❌ StoreContext: Error transferring guest cart:", error);
      toast({
        title: "Error",
        description: "Failed to transfer cart items to your account",
        variant: "destructive",
      });
    }
  };

  // Cart actions for authenticated users
  const addToCartAuthenticated = async (product: Product, quantity = 1) => {
    if (!user) return;

    try {
      console.log('🛒 StoreContext: Adding authenticated item to cart', { productId: product.id, quantity });
      const { data, error } = await cart.addItem(user.id, product.id!, quantity);
      if (error) {
        console.error("❌ StoreContext: Error adding to cart:", error);
        if (error.code === 'PERMISSION_DENIED') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to add items to your cart. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      // Show success toast
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
      // Send notification to admins
      await notifications.createAdminNotification(
        "Product Added to Cart",
        `User ${profile?.full_name || user.email} added ${product.name} to cart`,
        "cart"
      );
      
      // Refresh cart immediately after successful database operation
      await refreshCart();
      
      console.log('✅ StoreContext: Item added to cart successfully');
    } catch (error) {
      console.error("❌ StoreContext: Exception in addToCartAuthenticated:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Cart actions for guest users
  const addToCartGuest = async (product: Product, quantity = 1) => {
    try {
      // Check if product already exists in guest cart
      const existingItemIndex = guestCart.findIndex(item => item.productId === product.id);
      
      let updatedCart: GuestCartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedCart = [...guestCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item to cart
        updatedCart = [
          ...guestCart,
          {
            productId: product.id!,
            quantity,
            product
          }
        ];
      }
      
      setGuestCart(updatedCart);
      
      // Show success toast
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
      // Send notification to admins (for guest actions too)
      await notifications.createAdminNotification(
        "Guest Added to Cart",
        `Guest added ${product.name} to cart`,
        "cart"
      );
    } catch (error) {
      console.error("Error adding to guest cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Main addToCart function that handles both authenticated and guest users
  const addToCart = async (product: Product, quantity = 1) => {
    if (isAuthenticated) {
      await addToCartAuthenticated(product, quantity);
    } else {
      await addToCartGuest(product, quantity);
    }
  };

  const updateCartQuantityAuthenticated = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      const { error } = await cart.updateQuantity(user.id, productId, quantity);
      if (error) throw error;
      
      // Refresh cart immediately after successful database operation
      await refreshCart();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const updateCartQuantityGuest = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        // Remove item from guest cart
        setGuestCart(prev => prev.filter(item => item.productId !== productId));
      } else {
        // Update quantity of existing item
        setGuestCart(prev => 
          prev.map(item => 
            item.productId === productId 
              ? { ...item, quantity } 
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating guest cart quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      await updateCartQuantityAuthenticated(productId, quantity);
    } else {
      await updateCartQuantityGuest(productId, quantity);
    }
  };

  const removeFromCartAuthenticated = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await cart.removeItem(user.id, productId);
      if (error) throw error;
      
      // Refresh cart immediately after successful database operation
      await refreshCart();
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const removeFromCartGuest = async (productId: string) => {
    try {
      setGuestCart(prev => prev.filter(item => item.productId !== productId));
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error("Error removing from guest cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (isAuthenticated) {
      await removeFromCartAuthenticated(productId);
    } else {
      await removeFromCartGuest(productId);
    }
  };

  const clearCartAuthenticated = async () => {
    if (!user) return;

    try {
      const { error } = await cart.clearCart(user.id);
      if (error) throw error;
      
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const clearCartGuest = async () => {
    try {
      setGuestCart([]);
      localStorage.removeItem("guestCart");
      
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    } catch (error) {
      console.error("Error clearing guest cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await clearCartAuthenticated();
    } else {
      await clearCartGuest();
    }
  };

  // Favorites actions
  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage favorites",
      });
      return;
    }

    try {
      const { error } = await favorites.toggleFavorite(user.id, productId);
      if (error) throw error;
      
      // Show success toast
      const isNowFavorite = !isFavorite(productId);
      toast({
        title: isNowFavorite ? "Added to favorites" : "Removed from favorites",
        description: isNowFavorite 
          ? "Item has been added to your favorites" 
          : "Item has been removed from your favorites",
      });
      
      await refreshFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (productId: string) => {
    return favoriteProducts.some((product) => product.id === productId);
  };

  // Computed values
  const filteredProducts = productsData.filter((product) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = product.name?.toLowerCase().includes(query);
      const matchesDescription = product.description
        ?.toLowerCase()
        .includes(query);
      if (!matchesName && !matchesDescription) return false;
    }

    // Category filter
    if (selectedCategory) {
      return product.category_slug === selectedCategory;
    }

    return true;
  });

  // Calculate cart total based on authentication status
  const cartTotal = isAuthenticated 
    ? cartItems.reduce((total, item) => {
        const itemTotal = (item.products?.price || 0) * item.quantity;
        console.log('💰 Cart item calculation:', { 
          productId: item.product_id, 
          price: item.products?.price, 
          quantity: item.quantity, 
          itemTotal 
        });
        return total + itemTotal;
      }, 0)
    : guestCart.reduce((total, item) => {
        return total + (item.product?.price || 0) * item.quantity;
      }, 0);

  // Calculate cart item count based on authentication status
  const cartItemCount = isAuthenticated
    ? cartItems.reduce((count, item) => {
        const itemCount = item.quantity;
        console.log('🧺 Cart item count:', { 
          productId: item.product_id, 
          quantity: item.quantity, 
          itemCount 
        });
        return count + itemCount;
      }, 0)
    : guestCart.reduce((count, item) => count + item.quantity, 0);

  const deliveryFee = cartTotal >= 50000 ? 0 : 1500;
  const finalTotal = cartTotal + deliveryFee;

  const value: StoreContextType = {
    // Data
    products: productsData,
    categories: categoriesData,
    cartItems: isAuthenticated ? cartItems : guestCart.map(item => ({
      id: item.productId,
      user_id: null,
      product_id: item.productId,
      quantity: item.quantity,
      created_at: null,
      updated_at: null,
      products: item.product
    })) as CartItemWithProduct[],
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
    transferGuestCart,

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
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}