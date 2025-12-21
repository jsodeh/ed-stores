import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../shared/database.types";

const getSupabase = () => createClient<Database>(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "",
);

function getBearerToken(authHeader?: string) {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const handleAdminUsers: RequestHandler = async (req, res) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = getSupabase();

    // Validate the caller and ensure they are an admin
    const { data: authUser, error: authErr } =
      await supabase.auth.getUser(token);
    if (authErr || !authUser?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = authUser.user.id;
    const { data: callerProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileErr || !callerProfile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    const isAdmin = ["admin", "super_admin"].includes(callerProfile.role || "");
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, phone, role, created_at, whatsapp_enabled")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ users: data || [] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal server error" });
  }
};

export const handleToggleWhatsapp: RequestHandler = async (req, res) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const supabase = getSupabase();

    // Validate Status: Super Admin Only
    const { data: authUser, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authUser?.user) return res.status(401).json({ error: "Invalid session" });

    const { data: caller, error: callerErr } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", authUser.user.id)
      .single();

    if (callerErr || caller?.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }

    const { userId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid body: enabled must be boolean" });
    }

    const { error: updateErr } = await supabase
      .from("user_profiles")
      .update({ whatsapp_enabled: enabled })
      .eq("id", userId);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

