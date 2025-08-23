/**
 * Shared code between client and server
 * Types for ED Superstore ecommerce app
 */

export interface DemoResponse {
  message: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isFavorite?: boolean;
  description?: string;
  stock?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
}
