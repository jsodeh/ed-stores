
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking user_profiles schema...");

    // Try to select the column to see if it exists
    const { data, error } = await supabase
        .from("user_profiles")
        .select("whatsapp_enabled")
        .limit(1);

    if (error) {
        console.error("❌ Error selecting whatsapp_enabled:", error.message);
        console.log("This likely means the column does not exist or permissions are denied.");
    } else {
        console.log("✅ Column 'whatsapp_enabled' exists!");
        console.log("Sample data:", data);
    }
}

checkSchema();
