import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/database.types";

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function getBearerToken(authHeader?: string) {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const handleAdminOrders: RequestHandler = async (req, res) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authErr } =
      await supabase.auth.getUser(token);
    if (authErr || !authUser?.user)
      return res.status(401).json({ error: "Invalid session" });

    const userId = authUser.user.id;
    const { data: callerProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (profileErr || !callerProfile)
      return res.status(403).json({ error: "Profile not found" });
    const isAdmin = ["admin", "super_admin"].includes(callerProfile.role || "");
    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { data, error } = await supabase
      .from("order_details")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    res.status(200).json({ orders: data || [] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal server error" });
  }
};
