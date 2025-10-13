import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  supabase,
  products as productsApi,
  categories as categoriesApi,
  cart as cartApi,
  favorites as favoritesApi,
  notifications,
} from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { Product, Category, CartItem } from "@shared/database.types";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  isAddingToCart: boolean;
  isUpdatingCart: boolean;

  // Search and filters
  searchQuery: string;
  selectedCategory: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;

  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Favorites actions
  toggleFavorite: (productId: string) => void;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data fetching using react-query with optimized settings
  const { data: productsData = [], isLoading: productsLoading, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['products', selectedCategory, searchQuery],
    queryFn: async () => {
      console.log('🛍️ Fetching products:', { selectedCategory, searchQuery });
      const { data, error } = await productsApi.getAll({ category: selectedCategory, search: searchQuery });
      if (error) throw error;
      console.log('✅ Products fetched successfully:', data?.length, 'products');
      return data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes for product data
    retry: (failureCount, error) => {
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1500,
    meta: {
      errorMessage: "Failed to load products."
    },
  });

  const { data: categoriesData = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('📂 Fetching categories...');
      const { data, error } = await categoriesApi.getAll();
      if (error) throw error;
      console.log('✅ Categories fetched successfully:', data?.length, 'categories');
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for categories (they change less frequently)
    retry: (failureCount, error) => {
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1500,
    meta: {
      errorMessage: "Failed to load categories."
    },
  });

  const { data: cartItems = [], isLoading: cartLoading, error: cartError } = useQuery<CartItemWithProduct[], Error>({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('🛒 Fetching cart for user:', user.id);
      const { data, error } = await cartApi.getCart(user.id);
      if (error) throw error;
      console.log('✅ Cart fetched successfully:', data?.length, 'items');
      return (data || []) as CartItemWithProduct[];
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute for cart data (more dynamic)
    retry: (failureCount, error) => {
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
    meta: {
      errorMessage: "Failed to load cart."
    },
  });

  const { data: favoriteProducts = [], error: favoritesError } = useQuery<Product[], Error>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('❤️ Fetching favorites for user:', user.id);
      const { data, error } = await favoritesApi.getFavorites(user.id);
      if (error) throw error;
      const favorites = data?.map((fav) => fav.products).filter(Boolean) as Product[] || [];
      console.log('✅ Favorites fetched successfully:', favorites.length, 'items');
      return favorites;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes for favorites
    retry: (failureCount, error) => {
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
    meta: {
      errorMessage: "Failed to load favorites."
    },
  });

  // Error handling for queries
  useEffect(() => {
    if (productsError) {
      console.error('❌ Products fetch error:', productsError);
      toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    }
  }, [productsError, toast]);

  useEffect(() => {
    if (categoriesError) {
      console.error('❌ Categories fetch error:', categoriesError);
      toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" });
    }
  }, [categoriesError, toast]);

  useEffect(() => {
    if (cartError) {
      console.error('❌ Cart fetch error:', cartError);
      toast({ title: "Error", description: "Failed to load cart.", variant: "destructive" });
    }
  }, [cartError, toast]);

  useEffect(() => {
    if (favoritesError) {
      console.error('❌ Favorites fetch error:', favoritesError);
      toast({ title: "Error", description: "Failed to load favorites.", variant: "destructive" });
    }
  }, [favoritesError, toast]);

  // Mutations
  const addToCartMutation = useMutation({ 
    mutationFn: ({ product, quantity }: { product: Product, quantity: number }) => cartApi.addItem(user!.id, product.id!, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      toast({ title: "Added to cart" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" }),
  });

  const updateCartQuantityMutation = useMutation({ 
    mutationFn: ({ productId, quantity }: { productId: string, quantity: number }) => cartApi.updateQuantity(user!.id, productId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', user?.id] }),
    onError: () => toast({ title: "Error", description: "Failed to update cart item.", variant: "destructive" }),
  });

  const removeFromCartMutation = useMutation({ 
    mutationFn: (productId: string) => cartApi.removeItem(user!.id, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      toast({ title: "Removed from cart" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove item from cart.", variant: "destructive" }),
  });

  const clearCartMutation = useMutation({ 
    mutationFn: () => cartApi.clearCart(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', user?.id] }),
    onError: () => toast({ title: "Error", description: "Failed to clear cart.", variant: "destructive" }),
  });

  const toggleFavoriteMutation = useMutation({ 
    mutationFn: (productId: string) => favoritesApi.toggleFavorite(user!.id, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
    onError: () => toast({ title: "Error", description: "Failed to update favorites.", variant: "destructive" }),
  });

  // Guest cart logic and migration
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem("guestCart");
      if (savedCart) {
        try {
          setGuestCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error parsing guest cart", e);
        }
      }
    }
  }, [isAuthenticated]);

  // Migrate guest cart to authenticated cart when user logs in
  useEffect(() => {
    const migrateGuestCart = async () => {
      if (isAuthenticated && user && guestCart.length > 0) {
        console.log('🔄 Migrating guest cart to authenticated cart:', guestCart);
        
        try {
          const migrationResults = [];
          let successCount = 0;
          let failureCount = 0;
          
          // Migrate each guest cart item to the authenticated cart
          for (const guestItem of guestCart) {
            if (guestItem.product) {
              try {
                await cartApi.addItem(user.id, guestItem.productId, guestItem.quantity);
                successCount++;
                migrationResults.push({ success: true, product: guestItem.product.name });
              } catch (error) {
                failureCount++;
                migrationResults.push({ 
                  success: false, 
                  product: guestItem.product.name, 
                  error: error 
                });
                console.error(`Failed to migrate item ${guestItem.product.name}:`, error);
              }
            }
          }
          
          // Clear guest cart after migration attempt (regardless of individual failures)
          setGuestCart([]);
          localStorage.removeItem("guestCart");
          
          // Invalidate cart query to refresh the authenticated cart
          queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
          
          // Show appropriate toast message based on results
          if (successCount === guestCart.length) {
            console.log('✅ Guest cart migration completed successfully');
            toast({ 
              title: "Cart synced", 
              description: `${successCount} item(s) added to your cart.` 
            });
          } else if (successCount > 0) {
            console.log('⚠️ Guest cart migration partially completed');
            toast({ 
              title: "Cart partially synced", 
              description: `${successCount} item(s) added, ${failureCount} failed. Please try adding failed items again.`,
              variant: "destructive"
            });
          } else {
            console.log('❌ Guest cart migration completely failed');
            toast({ 
              title: "Cart sync failed", 
              description: "Could not sync your cart items. Please try adding them again.",
              variant: "destructive" 
            });
          }
        } catch (error) {
          console.error('❌ Guest cart migration failed:', error);
          toast({ 
            title: "Cart sync failed", 
            description: "Could not sync your guest cart items. Please try adding them again.",
            variant: "destructive" 
          });
        }
      }
    };

    // Only run migration once when user becomes authenticated
    if (isAuthenticated && user) {
      migrateGuestCart();
    }
  }, [isAuthenticated, user, queryClient]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
    }
  }, [guestCart, isAuthenticated]);

  // Real-time subscriptions with debouncing
  useEffect(() => {
    const channels = [];
    let invalidationTimeout: NodeJS.Timeout | null = null;
    
    const debouncedInvalidate = (queryKey: string[]) => {
      if (invalidationTimeout) {
        clearTimeout(invalidationTimeout);
      }
      
      invalidationTimeout = setTimeout(() => {
        console.log('🔄 Debounced invalidation: Refreshing', queryKey);
        queryClient.invalidateQueries({ queryKey });
      }, 1500); // Wait 1.5 seconds before invalidating
    };

    const productsSubscription = supabase
      .channel("products_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        console.log('🔄 Products changed:', payload.eventType);
        debouncedInvalidate(['products']);
      })
      .subscribe();
    channels.push(productsSubscription);

    if (user) {
      const cartSubscription = supabase
        .channel("cart_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, (payload) => {
          console.log('🔄 Cart changed for user:', user.id, payload.eventType);
          debouncedInvalidate(['cart', user.id]);
        })
        .subscribe();
      channels.push(cartSubscription);
    }

    return () => {
      if (invalidationTimeout) {
        clearTimeout(invalidationTimeout);
      }
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [user, queryClient]);

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    // Prevent multiple rapid clicks by checking if mutations are pending
    if (addToCartMutation.isPending || updateCartQuantityMutation.isPending) {
      console.log('🛒 Add to cart blocked: mutation already in progress');
      return;
    }

    if (isAuthenticated && user) {
      const existingCartItem = cartItems.find(item => item.product_id === product.id);
      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity;
        updateCartQuantityMutation.mutate({ productId: product.id!, quantity: newQuantity });
        toast({ title: "Cart updated" });
      } else {
        addToCartMutation.mutate({ product, quantity });
      }
    } else {
      // Allow guest cart functionality but show info about signing in for benefits
      const existingItem = guestCart.find(item => item.productId === product.id);
      if (existingItem) {
        setGuestCart(guestCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item));
      } else {
        setGuestCart([...guestCart, { productId: product.id!, quantity, product }]);
      }
      toast({ 
        title: "Added to cart", 
        description: "Sign in to sync your cart across devices and get member benefits"
      });
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (isAuthenticated) {
      updateCartQuantityMutation.mutate({ productId, quantity });
    } else {
      if (quantity <= 0) {
        setGuestCart(guestCart.filter(item => item.productId !== productId));
      } else {
        setGuestCart(guestCart.map(item => item.productId === productId ? { ...item, quantity } : item));
      }
    }
  };

  const removeFromCart = (productId: string) => {
    if (isAuthenticated) {
      removeFromCartMutation.mutate(productId);
    } else {
      setGuestCart(guestCart.filter(item => item.productId !== productId));
      toast({ title: "Removed from cart" });
    }
  };

  const clearCart = () => {
    if (isAuthenticated) {
      clearCartMutation.mutate();
    } else {
      setGuestCart([]);
      localStorage.removeItem("guestCart");
    }
  };

  // Favorites actions
  const toggleFavorite = (productId: string) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to add items to your favorites",
        variant: "destructive"
      });
      return;
    }
    console.log('🤍 Toggling favorite for product:', productId, 'user:', user.id);
    toggleFavoriteMutation.mutate(productId);
  };

  const isFavorite = (productId: string) => favoriteProducts.some((p) => p.id === productId);

  // Computed values
  const cartTotal = isAuthenticated
    ? cartItems.reduce((total, item) => total + (item.products?.price || 0) * item.quantity, 0)
    : guestCart.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);

  const cartItemCount = isAuthenticated
    ? cartItems.reduce((count, item) => count + item.quantity, 0)
    : guestCart.reduce((count, item) => count + item.quantity, 0);

  const deliveryFee = cartTotal >= 50000 ? 0 : 1500;
  const finalTotal = cartTotal + deliveryFee;

  const value: StoreContextType = {
    products: productsData,
    categories: categoriesData,
    cartItems: isAuthenticated ? cartItems : guestCart.map(item => ({ id: item.productId, user_id: null, product_id: item.productId, quantity: item.quantity, created_at: null, updated_at: null, products: item.product })) as CartItemWithProduct[],
    favoriteProducts,
    loading: productsLoading || categoriesLoading,
    cartLoading,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartQuantityMutation.isPending,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleFavorite,
    isFavorite,
    filteredProducts: productsData, // This will be handled by the query now
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