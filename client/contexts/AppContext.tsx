import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, CartItem } from '@shared/api';

// Extended product data
const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Onions",
    price: 8300,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop",
    category: "veggies",
    description: "Fresh red onions, perfect for cooking and salads. Rich in antioxidants and vitamins.",
    stock: 50
  },
  {
    id: "2", 
    name: "Beef Meat",
    price: 22000,
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=200&fit=crop",
    category: "meat",
    description: "Premium quality beef, perfect for grilling, stewing, or frying. High in protein.",
    stock: 25
  },
  {
    id: "3",
    name: "Fresh Tomatoes",
    price: 5500,
    image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=200&fit=crop",
    category: "veggies",
    description: "Ripe, juicy tomatoes perfect for cooking, salads, and sauces.",
    stock: 100
  },
  {
    id: "4",
    name: "Premium Rice",
    price: 15000,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop",
    category: "grocery",
    description: "High-quality long grain rice, perfect for all your cooking needs.",
    stock: 30
  },
  {
    id: "5",
    name: "Fresh Bread",
    price: 3500,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop",
    category: "bakery",
    description: "Freshly baked bread, soft and delicious. Perfect for breakfast and sandwiches.",
    stock: 20
  },
  {
    id: "6",
    name: "Chicken",
    price: 18000,
    image: "https://images.unsplash.com/photo-1548504769-900b70ed122e?w=300&h=200&fit=crop",
    category: "meat",
    description: "Fresh whole chicken, perfect for roasting or cooking in parts.",
    stock: 15
  },
  {
    id: "7",
    name: "Carrots",
    price: 4200,
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=200&fit=crop",
    category: "veggies",
    description: "Fresh orange carrots, great for cooking and snacking. Rich in vitamin A.",
    stock: 60
  },
  {
    id: "8",
    name: "Croissants",
    price: 2800,
    image: "https://images.unsplash.com/photo-1555507036-ab794f27d87e?w=300&h=200&fit=crop",
    category: "bakery",
    description: "Buttery, flaky croissants perfect for breakfast or a light snack.",
    stock: 12
  }
];

interface AppState {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  searchQuery: string;
  selectedCategory: string | null;
}

type AppAction = 
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'CLEAR_CART' };

const initialState: AppState = {
  products: PRODUCTS,
  cart: [],
  favorites: ['1', '2'], // Default favorites
  searchQuery: '',
  selectedCategory: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.product.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { product: action.payload, quantity: 1 }],
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload),
      };
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.product.id !== action.payload.productId),
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.includes(action.payload)
          ? state.favorites.filter(id => id !== action.payload)
          : [...state.favorites, action.payload],
      };
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };
    
    case 'SET_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleFavorite: (productId: string) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isInCart: (productId: string) => boolean;
  isFavorite: (productId: string) => boolean;
  getFilteredProducts: () => Product[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const toggleFavorite = (productId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: productId });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setCategory = (category: string | null) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (productId: string) => {
    return state.cart.some(item => item.product.id === productId);
  };

  const isFavorite = (productId: string) => {
    return state.favorites.includes(productId);
  };

  const getFilteredProducts = () => {
    let filtered = state.products;

    // Filter by search query
    if (state.searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (state.selectedCategory) {
      filtered = filtered.filter(product => product.category === state.selectedCategory);
    }

    return filtered;
  };

  const value: AppContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleFavorite,
    setSearchQuery,
    setCategory,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
    isFavorite,
    getFilteredProducts,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
