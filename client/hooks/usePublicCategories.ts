import { useCallback, useEffect, useRef, useState } from "react";
import { publicSupabase, supabase } from "@/lib/supabase";
import type { Category } from "@shared/database.types";

export function usePublicCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await publicSupabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setData(data || []);
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
      .channel("public-categories-refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  return { categories: data, loading, error, refresh: fetchAll };
}
