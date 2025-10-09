import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order } from "@shared/database.types";

export function useAdminOrders() {
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
  });
}