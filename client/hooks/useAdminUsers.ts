import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@shared/database.types";

interface UseAdminUsersReturn {
  users: UserProfile[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
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
      setUsers(body.users || []);
    } catch (e: any) {
      setUsers([]);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Try to refresh when realtime events occur (subject to RLS). If RLS blocks, this is harmless.
    const channel = supabase
      .channel("admin-users-refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_profiles" },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  return { users, loading, error, refresh: fetchUsers };
}
