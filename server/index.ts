import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGetProfile } from "./routes/profile";
import { handleAdminUsers } from "./routes/admin-users";
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

  // Serve static files - try multiple possible locations
  const possibleStaticPaths = [
    path.join(__dirname, "../spa"),           // Production build
    path.join(__dirname, "../dist/spa"),      // Alternative build location
    path.join(__dirname, "../client"),        // Development fallback
  ];
  
  let staticPath = null;
  for (const testPath of possibleStaticPaths) {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`📁 Using static files from: ${staticPath}`);
      break;
    }
  }
  
  if (staticPath) {
    app.use(express.static(staticPath));
  }

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
