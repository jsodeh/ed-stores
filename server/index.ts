import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGetProfile } from "./routes/profile";
import { handleAdminUsers } from "./routes/admin-users";
import { handleAdminOrders } from "./routes/admin-orders";
import fs from "fs";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Profile debugging route
  app.get("/api/profile/:userId", handleGetProfile);

  // Admin: list all users
  app.get("/api/admin/users", handleAdminUsers);
  app.patch("/api/admin/users/:userId/whatsapp", (req, res, next) => {
    import("./routes/admin-users").then(m => m.handleToggleWhatsapp(req, res, next)).catch(next);
  });

  // Admin: list orders (view)
  app.get("/api/admin/orders", handleAdminOrders);

  // Notifications
  app.post("/api/notifications/order-created", (req, res, next) => {
    import("./routes/notifications").then(m => m.handleOrderCreatedNotification(req, res, next)).catch(next);
  });

  // Serve static files - try multiple possible locations
  const possibleStaticPaths = [
    path.join(__dirname, "../spa"), // Production build
    path.join(__dirname, "../dist/spa"), // Alternative build location
    path.join(__dirname, "../client"), // Development fallback
  ];

  let staticPath = null;
  for (const testPath of possibleStaticPaths) {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`📁 Using static files from: ${staticPath}`);
      break;
    }
  }

  // Serve static files
  if (staticPath) {
    app.use(express.static(staticPath));
  }

  // Handle product share links with Open Graph tags
  app.get("/product/:id", async (req, res, next) => {
    try {
      const productId = req.params.id;

      // Determine index.html path (reuse logic from * handler)
      const possibleIndexPaths = [
        path.join(__dirname, "../spa/index.html"),
        path.join(__dirname, "../dist/spa/index.html"),
        path.join(__dirname, "../index.html"),
      ];

      let indexPath = null;
      for (const testPath of possibleIndexPaths) {
        if (fs.existsSync(testPath)) {
          indexPath = testPath;
          break;
        }
      }

      if (!indexPath) {
        return next();
      }

      // Initialize Supabase (dynamically to avoid top-level await issues if any)
      const { createClient } = await import("@supabase/supabase-js");
      const { Database } = await import("@shared/database.types"); // Type-only import usually, but valid for import()

      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Fetch product details
      const { data: product } = await supabase
        .from("products")
        .select("name, description, image_url, price")
        .eq("id", productId)
        .single();

      let html = fs.readFileSync(indexPath, "utf-8");

      if (product) {
        // Inject Open Graph tags
        const title = product.name || "EdStores Product";
        const description = product.description || `Check out ${product.name} on EdStores`;
        const image = product.image_url || "";
        const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        const price = product.price ? `₦${product.price.toLocaleString()}` : "";

        // Replace placeholders or inject into head
        const ogTags = `
          <meta property="og:title" content="${title} ${price ? `- ${price}` : ''}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          <meta property="og:url" content="${url}" />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${image}" />
        `;

        html = html.replace("</head>", `${ogTags}</head>`);
      }

      res.send(html);
    } catch (e) {
      console.error("Error serving product page:", e);
      next();
    }
  });

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }

    // Try multiple possible index.html locations
    const possibleIndexPaths = [
      path.join(__dirname, "../spa/index.html"),
      path.join(__dirname, "../dist/spa/index.html"),
      path.join(__dirname, "../index.html"),
    ];

    let indexPath = null;
    for (const testPath of possibleIndexPaths) {
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        break;
      }
    }

    if (indexPath) {
      console.log(`📄 Serving SPA for route: ${req.path} -> ${indexPath}`);
      res.sendFile(indexPath);
    } else {
      console.log(`❌ No index.html found. Tried paths:`, possibleIndexPaths);
      res.status(404).send(`
        <h1>SPA Not Found</h1>
        <p>This appears to be a development server issue.</p>
        <p>For development, please use: <code>npm run dev</code></p>
        <p>For production, please run: <code>npm run build</code> first</p>
        <p>Current route: ${req.path}</p>
      `);
    }
  });

  return app;
}
