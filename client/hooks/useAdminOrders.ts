import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order } from "@shared/database.types";
import { useEffect } from "react";

export function useAdminOrders() {
  const queryClient = useQueryClient();

  // Set up real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          console.log('🔄 Order items changed, invalidating admin orders cache:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔄 Orders table changed, invalidating admin orders cache:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    refetchOnWindowFocus: true, // Refetch when admin returns to the tab
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}