import { useQuery } from "@tanstack/react-query";
import { categories as categoriesApi } from "@/lib/supabase";
import type { Category } from "@shared/database.types";

export function usePublicCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => {
      if (res.error) throw res.error;
      return res.data || [];
    }),
  });
}