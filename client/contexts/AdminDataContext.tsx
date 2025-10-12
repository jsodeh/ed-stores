import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { adminCache } from '@/hooks/useAdminCache';

interface AdminDataContextType {
  refreshAll: () => Promise<void>;
  invalidateAll: () => void;
  isOnline: boolean;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up global realtime subscriptions for cache invalidation
    const adminChannels = [
      // Products channel
      supabase.channel('admin-products').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('🔄 Products table changed:', payload);
          adminCache.invalidatePattern('products');
          adminCache.invalidatePattern('dashboard');
        }
      ),

      // Categories channel
      supabase.channel('admin-categories').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('🔄 Categories table changed:', payload);
          adminCache.invalidatePattern('categories');
          adminCache.invalidatePattern('products'); // Products depend on categories
        }
      ),

      // Orders channel - listen to both orders and order_details tables
      supabase.channel('admin-orders').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔄 Orders table changed:', payload);
          adminCache.invalidatePattern('orders');
          adminCache.invalidatePattern('admin-orders');
          adminCache.invalidatePattern('dashboard');
        }
      ),
      
      // Order details channel
      supabase.channel('admin-order-details').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_details' },
        (payload) => {
          console.log('🔄 Order details table changed:', payload);
          adminCache.invalidatePattern('orders');
          adminCache.invalidatePattern('admin-orders');
          adminCache.invalidatePattern('dashboard');
        }
      ),

      // Users channel
      supabase.channel('admin-users').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('🔄 User profiles table changed:', payload);
          adminCache.invalidatePattern('users');
          adminCache.invalidatePattern('dashboard');
        }
      ),
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());
    setChannels(channels);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Unsubscribe from channels
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [isAuthenticated, isAdmin, adminCache]);

  const refreshAll = async () => {
    console.log('🔄 Refreshing all admin data...');
    adminCache.clear();
    // Trigger a page refresh to reload all components
    window.location.reload();
  };

  const invalidateAll = () => {
    console.log('🗑️ Invalidating all admin cache...');
    adminCache.clear();
  };

  const value = {
    refreshAll,
    invalidateAll,
    isOnline
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}