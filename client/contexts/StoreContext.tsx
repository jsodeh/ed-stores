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

  // Data fetching using react-query
  const { data: productsData = [], isLoading: productsLoading } = useQuery<Product[], Error>({
    queryKey: ['products', selectedCategory, searchQuery],
    queryFn: async () => {
      const { data, error } = await productsApi.getAll({ category: selectedCategory, search: searchQuery });
      if (error) throw error;
      return data || [];
    },
    onError: () => toast({ title: "Error", description: "Failed to load products.", variant: "destructive" }),
  });

  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await categoriesApi.getAll();
      if (error) throw error;
      return data || [];
    },
    onError: () => toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" }),
  });

  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItemWithProduct[], Error>({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await cartApi.getCart(user.id);
      if (error) throw error;
      return (data || []) as CartItemWithProduct[];
    },
    enabled: !!user,
    onError: () => toast({ title: "Error", description: "Failed to load cart.", variant: "destructive" }),
  });

  const { data: favoriteProducts = [] } = useQuery<Product[], Error>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await favoritesApi.getFavorites(user.id);
      if (error) throw error;
      return data?.map((fav) => fav.products).filter(Boolean) as Product[] || [];
    },
    enabled: !!user,
    onError: () => toast({ title: "Error", description: "Failed to load favorites.", variant: "destructive" }),
  });

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

  // Guest cart logic
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

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
    }
  }, [guestCart, isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    const channels = [];
    const productsSubscription = supabase
      .channel("products_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      })
      .subscribe();
    channels.push(productsSubscription);

    if (user) {
      const cartSubscription = supabase
        .channel("cart_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
        })
        .subscribe();
      channels.push(cartSubscription);
    }

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [user, queryClient]);

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    if (isAuthenticated) {
      addToCartMutation.mutate({ product, quantity });
    } else {
      const existingItem = guestCart.find(item => item.productId === product.id);
      if (existingItem) {
        setGuestCart(guestCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item));
      } else {
        setGuestCart([...guestCart, { productId: product.id!, quantity, product }]);
      }
      toast({ title: "Added to cart" });
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
      toast({ title: "Sign in required", description: "Please sign in to manage favorites" });
      return;
    }
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