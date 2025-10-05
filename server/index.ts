import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGetProfile } from "./routes/profile";
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

  // Serve static files from the client directory
  app.use(express.static(path.join(__dirname, "../client")));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Serve index.html for client-side routing
    const indexPath = path.join(__dirname, "../index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });

  return app;
}