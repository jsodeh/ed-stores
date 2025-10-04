import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/database.types";

// Create a Supabase client with service role key for admin access
const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Get user profile with service role key (bypasses RLS)
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
    
    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in handleGetProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};