export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string | null
          type: string | null
          street_address: string
          city: string
          state: string
          postal_code: string | null
          country: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: string | null
          street_address: string
          city: string
          state: string
          postal_code?: string | null
          country?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string | null
          street_address?: string
          city?: string
          state?: string
          postal_code?: string | null
          country?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          id: string
          user_id: string | null
          product_id: string | null
          quantity: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          quantity: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          quantity?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          slug: string
          is_active: boolean | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          slug: string
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          slug?: string
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string | null
          product_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          id: string
          product_id: string | null
          type: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          type: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          type?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          recipient_id: string | null
          subject: string | null
          message: string
          is_read: boolean | null
          message_type: string | null
          related_order_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          subject?: string | null
          message: string
          is_read?: boolean | null
          message_type?: string | null
          related_order_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          subject?: string | null
          message?: string
          is_read?: boolean | null
          message_type?: string | null
          related_order_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: string | null
          is_read: boolean | null
          action_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: string | null
          is_read?: boolean | null
          action_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: string | null
          is_read?: boolean | null
          action_url?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          subtotal: number
          delivery_fee: number | null
          tax_amount: number | null
          discount_amount: number | null
          delivery_address_id: string | null
          delivery_notes: string | null
          delivery_date: string | null
          payment_method: string | null
          payment_status: string | null
          payment_reference: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          subtotal: number
          delivery_fee?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          delivery_address_id?: string | null
          delivery_notes?: string | null
          delivery_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          subtotal?: number
          delivery_fee?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          delivery_address_id?: string | null
          delivery_notes?: string | null
          delivery_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string | null
          user_id: string | null
          rating: number | null
          title: string | null
          comment: string | null
          is_approved: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          rating?: number | null
          title?: string | null
          comment?: string | null
          is_approved?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          rating?: number | null
          title?: string | null
          comment?: string | null
          is_approved?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category_id: string | null
          image_url: string | null
          images: string[] | null
          sku: string | null
          stock_quantity: number | null
          low_stock_threshold: number | null
          is_active: boolean | null
          is_featured: boolean | null
          weight: number | null
          dimensions: Json | null
          meta_title: string | null
          meta_description: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category_id?: string | null
          image_url?: string | null
          images?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          weight?: number | null
          dimensions?: Json | null
          meta_title?: string | null
          meta_description?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category_id?: string | null
          image_url?: string | null
          images?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          weight?: number | null
          dimensions?: Json | null
          meta_title?: string | null
          meta_description?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_details: {
        Row: {
          id: string | null
          user_id: string | null
          order_number: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          subtotal: number | null
          delivery_fee: number | null
          tax_amount: number | null
          discount_amount: number | null
          delivery_address_id: string | null
          delivery_notes: string | null
          delivery_date: string | null
          payment_method: string | null
          payment_status: string | null
          payment_reference: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          street_address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          item_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_details: {
        Row: {
          id: string | null
          name: string | null
          description: string | null
          price: number | null
          category_id: string | null
          image_url: string | null
          images: string[] | null
          sku: string | null
          stock_quantity: number | null
          low_stock_threshold: number | null
          is_active: boolean | null
          is_featured: boolean | null
          weight: number | null
          dimensions: Json | null
          meta_title: string | null
          meta_description: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
          category_name: string | null
          category_slug: string | null
          category_color: string | null
          average_rating: number | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_order_from_cart: {
        Args: {
          p_user_id: string
          p_delivery_address_id: string
          p_delivery_notes?: string
          p_payment_method?: string
        }
        Returns: string
      }
      update_product_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_type: string
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
      user_role: "customer" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Product = Database['public']['Views']['product_details']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Order = Database['public']['Views']['order_details']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type UserRole = Database['public']['Enums']['user_role']
export type OrderStatus = Database['public']['Enums']['order_status']
