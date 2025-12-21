import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../shared/database.types";
import { WhatsAppService } from "../services/whatsapp";

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

export const handleOrderCreatedNotification: RequestHandler = async (req, res) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const supabase = getSupabase();

        // Verify user is authenticated
        const { data: authUser, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !authUser?.user) {
            return res.status(401).json({ error: "Invalid session" });
        }

        // Expected body: { orderNumber: string }
        const { orderNumber } = req.body;
        if (!orderNumber) {
            return res.status(400).json({ error: "Missing orderNumber" });
        }

        // 1. Fetch order details to get products and total
        // We use the admin view/query to get full details
        const { data: order, error: orderErr } = await supabase
            .from("orders")
            .select(`
        total_amount,
        order_items (
          product_id,
          quantity,
          products ( name )
        )
      `)
            .eq("order_number", orderNumber)
            .single();

        if (orderErr || !order) {
            console.error("Order not found for notification:", orderNumber, orderErr);
            return res.status(404).json({ error: "Order not found" });
        }

        // Prepare message data
        const total = `₦${order.total_amount.toLocaleString()}`;
        // @ts-ignore - Supabase types join inference can be tricky, casting for safety
        const productNames = order.order_items?.map((item: any) =>
            `${item.quantity}x ${item.products?.name || "Unknown Product"}`
        ) || [];

        // 2. Fetch admins who have whatsapp_enabled = true
        const { data: admins, error: adminErr } = await supabase
            .from("user_profiles")
            .select("phone")
            .eq("whatsapp_enabled", true)
            .not("phone", "is", null);

        if (adminErr) {
            console.error("Error fetching admins for notification:", adminErr);
            return res.status(500).json({ error: "Failed to fetch recipients" });
        }

        const adminPhones = admins?.map(a => a.phone!).filter(Boolean) || [];

        // 3. Send Notification
        await WhatsAppService.sendOrderNotification(productNames, total, adminPhones);

        return res.status(200).json({ success: true, recipients: adminPhones.length });

    } catch (e: any) {
        console.error("Notification Handler Error:", e);
        res.status(500).json({ error: e?.message || "Internal server error" });
    }
};
