import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, admin } from "@/lib/supabase";
import type { Order } from "@shared/database.types";
import { useEffect, useRef } from "react";

export function useAdminOrders() {
  const queryClient = useQueryClient();
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced invalidation to prevent rapid successive invalidations
  const debouncedInvalidate = () => {
    if (invalidationTimeoutRef.current) {
      clearTimeout(invalidationTimeoutRef.current);
    }
    
    invalidationTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Debounced invalidation: Refreshing admin orders cache');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    }, 1000); // Wait 1 second before invalidating
  };

  // Set up real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          console.log('🔄 Order items changed:', payload.eventType);
          debouncedInvalidate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔄 Orders table changed:', payload.eventType);
          debouncedInvalidate();
        }
      )
      .subscribe();

    return () => {
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      console.log('📊 Fetching admin orders...');
      const { data, error } = await admin.getAllOrders();
      
      if (error) {
        console.error('❌ Admin orders fetch error:', error);
        throw error;
      }

      console.log('✅ Admin orders fetched successfully:', data.length, 'orders');
      return data;
    },
    // Use the global query client settings, but override specific ones if needed
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 2000,
  });
}