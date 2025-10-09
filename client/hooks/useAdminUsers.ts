import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@shared/database.types";

export function useAdminUsers() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr || !session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const body = (await res.json()) as { users: UserProfile[] };
      return body.users || [];
    },
  });
}