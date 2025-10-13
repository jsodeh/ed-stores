import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { orders, supabase } from "@/lib/supabase";
import { Order } from "@shared/database.types";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, MapPin, Phone } from "lucide-react";

export default function OrderDetails() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]); // Use any[] for now to avoid type issues
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Instead of redirecting to home, we should show a message or redirect to sign-in
      // navigate("/"); // Removed redirect to home
    }
  }, [isAuthenticated, navigate]);

  // Load order details
  useEffect(() => {
    if (isAuthenticated && user && orderId) {
      loadOrderDetails();

      // Set up real-time subscription for this specific order
      const channel = supabase
        .channel('user-order-details-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            console.log('🔄 User Order Details: Real-time update received:', payload);
            loadOrderDetails(); // Reload order details when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user, orderId]);

  const loadOrderDetails = async () => {
    if (!user || !orderId) return;

    setLoading(true);
    setError(null);
    try {
      // First, get the order details
      const { data: orderData, error: orderError } = await orders.getUserOrders(user.id);
      if (orderError) {
        console.error("Error loading order:", orderError);
        setError("Failed to load order details. Please try again later.");
        return;
      }

      // Find the specific order
      const specificOrder = orderData?.find(order => order.id === orderId);
      if (!specificOrder) {
        setError("Order not found.");
        return;
      }

      setOrder(specificOrder);

      // Then, get the order items separately
      const { data: itemsData, error: itemsError } = await orders.getOrderItems(orderId);
      if (itemsError) {
        console.error("Error loading order items:", itemsError);
        // Don't return here, just show empty items
      } else {
        setOrderItems(itemsData || []);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      setError("Failed to load order details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      case "confirmed":
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
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center text-red-600">{error}</div>
              <div className="text-center mt-4">
                <Button onClick={loadOrderDetails} variant="outline">
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
        ) : order ? (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Order {order.order_number}</CardTitle>
                    <p className="text-gray-600">Placed on {formatDate(order.created_at || "")}</p>
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
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p>{order.customer_name}</p>
                          <p>{order.street_address}</p>
                          <p>{order.city}, {order.state}</p>
                          <p>{order.postal_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{order.customer_phone || "No phone provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items ({order.item_count}):</span>
                        <span>{formatPrice((order.subtotal || 0) - (order.tax_amount || 0) - (order.discount_amount || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span>{order.delivery_fee === 0 ? "FREE" : formatPrice(order.delivery_fee || 0)}</span>
                      </div>
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-{formatPrice(order.discount_amount)}</span>
                        </div>
                      )}
                      {order.tax_amount && order.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>{formatPrice(order.tax_amount)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Total:</span>
                        <span className="text-primary">{formatPrice(order.total_amount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">
                      {order.payment_method === 'transfer' ? 'Bank Transfer' :
                        order.payment_method === 'cash' ? 'Cash on Pickup' :
                          order.payment_method || 'N/A'}
                    </span>
                  </div>
                  {order.payment_reference && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reference: {order.payment_reference}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items in this Order</CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems && orderItems.length > 0 ? (
                  <div className="space-y-4">
                    {orderItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        {item.products?.image_url ? (
                          <img
                            src={item.products.image_url}
                            alt={item.products.name || ""}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.products?.name || "Product"}</h3>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <div className="font-semibold">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No items found for this order</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/orders")}
              >
                Back to Orders
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => navigate("/store")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Order Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button
                onClick={() => navigate("/orders")}
                className="bg-primary hover:bg-primary/90"
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}