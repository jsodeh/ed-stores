import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "."],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    // Optimize for production deployment
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  // Enable SPA mode for proper client-side routing
  appType: 'spa',
  plugins: [
    react(),
    {
      name: 'spa-fallback-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url;
          
          // Skip API routes, assets, and Vite internal routes
          if (
            url?.startsWith('/api') ||
            url?.startsWith('/@') ||
            url?.startsWith('/__vite') ||
            url?.includes('.') ||
            url === '/favicon.ico'
          ) {
            return next();
          }
          
          // For all other routes, rewrite to serve index.html
          console.log(`🔄 Vite SPA: Rewriting ${url} -> /index.html`);
          req.url = '/index.html';
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});