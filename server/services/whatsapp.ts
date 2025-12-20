
/**
 * Service to handle sending WhatsApp notifications via Meta's Cloud API.
 * 
 * required Environment Variables:
 * - WHATSAPP_ACCESS_TOKEN: System User Access Token with 'whatsapp_business_messaging' permission
 * - WHATSAPP_PHONE_NUMBER_ID: The ID of the WhatsApp phone number sending the messages
 */
export class WhatsAppService {
  private static readonly GRAPH_API_VERSION = "v20.0";
  private static readonly BASE_URL = "https://graph.facebook.com";

  /**
   * Send an order notification to a list of phone numbers.
   */
  static async sendOrderNotification(products: string[], total: string, adminPhones: string[]) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.error("❌ WhatsApp Service Error: Missing environment variables (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)");
      return;
    }

    // Filter out invalid phone numbers
    const validPhones = adminPhones.filter(p => p && p.trim().length > 0);

    if (validPhones.length === 0) {
      console.log('⚠️ No valid admin phone numbers for WhatsApp notification.');
      return;
    }

    // Construct the message
    // Note: Free-form text messages can only be sent if the 24-hour conversation window is open.
    // Otherwise, you must use a template. For verified business accounts interacting with admins (who likely messaged first),
    // or properly configured templates, this will work. 
    // For this implementation, we are using standard text messages assuming admins have initiated contact 
    // or the business has capability to send sessions. 
    // Ideally, convert this to use a 'template' message type for production reliability.
    const messageBody = `
📦 *New Order Received!*
------------------------
*Items:*
${products.map(p => `- ${p}`).join('\n')}

💰 *Total:* ${total}

Verify the order in your admin dashboard.
    `.trim();

    console.log(`📱 [WhatsApp Service] Sending to ${validPhones.length} admins...`);

    const results = await Promise.allSettled(validPhones.map(async (phone) => {
      // Basic formatting: Remove '+' or special chars, ensure international format relative to what the API expects.
      // Meta usually expects pure numbers with country code, e.g., "15551234567"
      const formattedPhone = phone.replace(/\D/g, '');

      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${phoneId}/messages`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: messageBody
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WhatsApp API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    }));

    // Log results
    results.forEach((result, index) => {
      const phone = validPhones[index];
      if (result.status === 'fulfilled') {
        console.log(`✅ Sent WhatsApp to ${phone}`);
      } else {
        console.error(`❌ Failed to send to ${phone}:`, result.reason);
      }
    });
  }
}
