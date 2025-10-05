import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

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

              {/* Admin Routes - Protected with AuthGuard */}
              <Route 
                path="/admin" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/products" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminProducts />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminUsers />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/orders" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminOrders />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/order/:orderId" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminOrderDetails />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/categories" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminCategories />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/inventory" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminInventory />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/messages" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminMessages />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/notifications" 
                element={
                  <AuthGuard requireAuth requireAdmin>
                    <AdminNotifications />
                  </AuthGuard>
                } 
              />

              {/* Catch-all route for 404 pages */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);