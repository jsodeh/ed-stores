import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface AdminDataContextType {
  refreshAll: () => Promise<void>;
  invalidateAll: () => void;
  isOnline: boolean;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();
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
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      ),

      // Categories channel
      supabase.channel('admin-categories').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('🔄 Categories table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['products'] }); // Products depend on categories
        }
      ),

      // Orders channel - listen to both orders and order_details tables
      supabase.channel('admin-orders').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔄 Orders table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      ),

      // Order details channel
      supabase.channel('admin-order-details').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_details' },
        (payload) => {
          console.log('🔄 Order details table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      ),

      // Users channel
      supabase.channel('admin-users').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('🔄 User profiles table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
  }, [isAuthenticated, isAdmin, queryClient]);

  const refreshAll = async () => {
    console.log('🔄 Refreshing all admin data...');
    queryClient.invalidateQueries();
    // Trigger a page refresh to reload all components
    window.location.reload();
  };

  const invalidateAll = () => {
    console.log('🗑️ Invalidating all admin cache...');
    queryClient.invalidateQueries();
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