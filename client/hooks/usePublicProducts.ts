import { useCallback, useEffect, useRef, useState } from "react";
import {
  products as productsApi,
  publicSupabase,
  supabase,
} from "@/lib/supabase";
import type { Product } from "@shared/database.types";

export function usePublicProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.getAll();
      if (result.error) throw result.error;
      setData((result.data as any) || []);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("public-products-refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  return { products: data, loading, error, refresh: fetchAll };
}
