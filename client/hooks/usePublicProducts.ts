import { useQuery } from "@tanstack/react-query";
import { products as productsApi } from "@/lib/supabase";
import type { Product } from "@shared/database.types";

export function usePublicProducts({ category, search }: { category?: string | null, search?: string | null } = {}) {
  return useQuery<Product[], Error>({
    queryKey: ['products', { category, search }],
    queryFn: () => productsApi.getAll({ category, search }).then(res => {
      if (res.error) throw res.error;
      return res.data || [];
    }),
  });
}