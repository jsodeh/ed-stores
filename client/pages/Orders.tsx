import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { orders, supabase } from "@/lib/supabase";
import { Order } from "@shared/database.types";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Instead of redirecting to home, we should show a message or redirect to sign-in
      // navigate("/"); // Removed redirect to home
    }
  }, [isAuthenticated, navigate]);

  // Load user orders when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserOrders();
      
      // Set up real-time subscription for order updates
      const channel = supabase
        .channel('user-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('🔄 User Orders: Real-time update received:', payload);
            loadUserOrders(); // Reload orders when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user]);

  const loadUserOrders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await orders.getUserOrders(user.id);
      if (error) {
        console.error("Error loading orders:", error);
        setError("Failed to load orders. Please try again later.");
        return;
      }

      const ordersList = data || [];
      setUserOrders(ordersList);
    } catch (error) {
      console.error("Error loading orders:", error);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      case "shipped":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // If not authenticated, show nothing (redirect handled by useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>

      <main className="max-w-4xl mx-auto p-4 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center text-red-600">{error}</div>
              <div className="text-center mt-4">
                <Button onClick={loadUserOrders} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : userOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Button
                onClick={() => navigate("/store")}
                className="bg-primary hover:bg-primary/90"
              >
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userOrders
              .sort(
                (a, b) =>
                  new Date(b.created_at || "").getTime() -
                  new Date(a.created_at || "").getTime()
              )
              .map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">Order {order.order_number}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.created_at || "")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status || "")}
                        <Badge variant={getStatusVariant(order.status || "") as any}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">{order.item_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold text-primary">
                          {formatPrice(order.total_amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-medium">
                          {order.payment_method || "N/A"}
                        </span>
                      </div>
                      {order.delivery_address_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery:</span>
                          <span className="font-medium">
                            {order.street_address
                              ? `${order.street_address}, ${order.city}`
                              : "Address not specified"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}