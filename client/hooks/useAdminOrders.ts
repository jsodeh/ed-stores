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
        { event: '*', schema: 'public', table: 'order_details' },
        (payload) => {
          console.log('🔄 Order details changed, invalidating admin orders cache:', payload);
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

  return useQuery<Order[], Error>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const body = (await res.json()) as { orders: Order[] };
      return body.orders || [];
    },
    refetchOnWindowFocus: true, // Refetch when admin returns to the tab
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}