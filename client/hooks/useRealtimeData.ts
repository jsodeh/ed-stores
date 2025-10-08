import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeDataOptions<T> {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  initialData?: T[];
  enabled?: boolean;
}

interface UseRealtimeDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useRealtimeData<T = any>({
  table,
  select = "*",
  filter = {},
  orderBy,
  initialData = [],
  enabled = true,
}: UseRealtimeDataOptions<T>): UseRealtimeDataReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);

  // Use refs to store latest values without causing re-renders
  const tableRef = useRef(table);
  const selectRef = useRef(select);
  const filterRef = useRef(filter);
  const orderByRef = useRef(orderBy);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    tableRef.current = table;
    selectRef.current = select;
    filterRef.current = filter;
    orderByRef.current = orderBy;
    enabledRef.current = enabled;
  }, [table, select, filter, orderBy, enabled]);

  const fetchData = useCallback(async () => {
    if (!enabledRef.current || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Failsafe: turn off loading if request hangs
    let timeoutId: number | undefined;
    const startTimeout = () => {
      // 12s safety timeout
      timeoutId = window.setTimeout(() => {
        if (loadingRef.current) {
          console.warn(
            `Timeout fetching ${tableRef.current}. Showing fallback error.`,
          );
          setError(new Error("Request timeout. Please try again."));
          setLoading(false);
          loadingRef.current = false;
        }
      }, 12000);
    };
    const clearTimeoutIfAny = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    try {
      startTimeout();
      let query = supabase.from(tableRef.current).select(selectRef.current);

      // Apply filters
      Object.entries(filterRef.current).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderByRef.current) {
        query = query.order(orderByRef.current.column, {
          ascending: orderByRef.current.ascending ?? true,
        });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData(fetchedData || []);
    } catch (err) {
      console.error(`Error fetching ${tableRef.current}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      clearTimeoutIfAny();
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload);

          // Refresh data on any change
          if (!loadingRef.current) {
            fetchData();
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, table, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// Specialized hook for admin dashboard stats
export function useAdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const withTimeout = <T>(p: Promise<T>, ms = 12000): Promise<T> =>
        new Promise((resolve) => {
          let done = false;
          const t = window.setTimeout(() => {
            if (!done) {
              done = true;
              // @ts-expect-error
              resolve({ data: [] });
            }
          }, ms);
          p.then((v) => {
            if (!done) {
              done = true;
              window.clearTimeout(t);
              resolve(v);
            }
          }).catch(() => {
            if (!done) {
              done = true;
              window.clearTimeout(t);
              // @ts-expect-error
              resolve({ data: [] });
            }
          });
        });

      const [
        adminUsersResult,
        productsResult,
        ordersResult,
        recentOrdersResult,
        lowStockResult,
        orderStatsResult,
      ] = await Promise.allSettled([
        (async () => {
          if (!token) return { data: [] } as const;
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), 12000);
          const res = await fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          window.clearTimeout(timer);
          if (!res.ok) return { data: [] } as const;
          const body = await res.json();
          return { data: body.users as any[] } as const;
        })(),
        withTimeout(supabase.from("products").select("id")),
        withTimeout(supabase.from("orders").select("total_amount")),
        withTimeout(
          supabase
            .from("order_details")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ),
        withTimeout(
          supabase
            .from("products")
            .select("id, name, stock_quantity, low_stock_threshold")
            .filter("stock_quantity", "lt", "low_stock_threshold")
            .limit(5),
        ),
        withTimeout(supabase.from("orders").select("status")),
      ]);

      const extractData = (result: any) =>
        result.status === "fulfilled" ? result.value.data || [] : [];

      const adminUsers = extractData(adminUsersResult);
      const products = extractData(productsResult);
      const orders = extractData(ordersResult);
      const recentOrders = extractData(recentOrdersResult);
      const lowStockProducts = extractData(lowStockResult);
      const orderStatuses = extractData(orderStatsResult);

      const recentUsers = (adminUsers as any[])
        .slice(0, 5)
        .map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          created_at: u.created_at,
          role: u.role,
        }));

      const totalRevenue = orders.reduce(
        (sum: number, order: any) => sum + (order.total_amount || 0),
        0,
      );

      const ordersByStatus = orderStatuses.reduce((acc: any, order: any) => {
        if (order.status) {
          acc[order.status] = (acc[order.status] || 0) + 1;
        }
        return acc;
      }, {});

      const dashboardStats = {
        totalUsers: adminUsers.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        recentOrders,
        lowStockProducts,
        recentUsers,
        orderStats: {
          pending: ordersByStatus?.pending || 0,
          confirmed: ordersByStatus?.confirmed || 0,
          delivered: ordersByStatus?.delivered || 0,
          cancelled: ordersByStatus?.cancelled || 0,
        },
      };

      setStats(dashboardStats);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Set up realtime subscriptions for relevant tables
    const channels = [
      supabase
        .channel("admin-stats-users")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_profiles" },
          () => fetchStats(),
        ),
      supabase
        .channel("admin-stats-products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => fetchStats(),
        ),
      supabase
        .channel("admin-stats-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => fetchStats(),
        ),
    ];

    channels.forEach((channel) => channel.subscribe());

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
