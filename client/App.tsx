import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickActionsButton } from "./components/QuickActionsButton";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { StoreProvider } from "./contexts/StoreContext";
import Index from "./pages/Index";
import Test from "./pages/Test";
import Store from "./pages/Store";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import UserDebugPage from "./pages/UserDebug"; // Add this line
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetails from "./pages/admin/OrderDetails";
import AdminCategories from "./pages/admin/Categories";
import AdminInventory from "./pages/admin/Inventory";
import AdminMessages from "./pages/admin/Messages";
import AdminNotifications from "./pages/admin/Notifications";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./contexts/AuthContext";

// Configure React Query client for reliable data persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent aggressive refetching that causes loading loops
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      
      // Set reasonable retry and stale time limits
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Balanced stale time for data freshness vs performance
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep data longer for better UX
      
      // Handle errors gracefully to prevent data loss on reload
      throwOnError: false,
      
      // Ensure queries refetch when they become enabled (important for auth-dependent queries)
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/test" element={<Test />} />
              <Route path="/store" element={<Store />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:orderId" element={<OrderDetails />} />
              <Route path="/user-debug" element={<UserDebugPage />} />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="order/:orderId" element={<AdminOrderDetails />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="notifications" element={<AdminNotifications />} />
              </Route>

              {/* Catch-all route for 404 pages */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <QuickActionsButton />
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);