import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@shared/database.types";

export function useAdminUsers() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
}