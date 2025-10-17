import { useState, useEffect } from "react";
// Remove AdminPage import - we'll use a simple div wrapper
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase, admin, notifications } from "@/lib/supabase";
import { Order, OrderItem } from "@shared/database.types";

// Extended order type with order items
interface OrderWithItems extends Order {
  order_items?: (OrderItem & {
    products?: {
      id: string;
      name: string;
      image_url: string;
      price: number;
    };
  })[];
}
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, MapPin, Phone, Send } from "lucide-react";

export default function AdminOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Load order details
  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_details")
        .select(`
          *,
          order_items:order_items(
            *,
            products:product_id (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
      setNewStatus(data.status || "");
    } catch (error) {
      console.error("Error loading order:", error);
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
      case "processing":
        return <Package className="h-4 w-4 text-blue-600" />;
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
      case "processing":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || newStatus === order.status) return;

    setUpdating(true);
    try {
      // Update order status
      const { data, error } = await admin.updateOrderStatus(order.id!, newStatus as any);
      if (error) throw error;

      // Update local state
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);

      // Create notification for the user
      if (order.user_id) {
        const statusLabels: Record<string, string> = {
          pending: "is being reviewed",
          confirmed: "has been confirmed",
          processing: "is being processed",
          shipped: "has been shipped",
          delivered: "has been delivered",
          cancelled: "has been cancelled"
        };

        const message = `Your order ${order.order_number} ${statusLabels[newStatus] || "status has been updated"}.`;
        
        await notifications.createNotification(
          order.user_id,
          `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          message,
          "order",
          `/order/${order.id}`
        );
      }

      // Show success message
      setNotificationMessage(`Order status updated to ${newStatus}`);
      setTimeout(() => setNotificationMessage(""), 3000);
    } catch (error) {
      console.error("Error updating order status:", error);
      setNotificationMessage("Failed to update order status");
      setTimeout(() => setNotificationMessage(""), 3000);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/admin/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>

        {/* Notification Message */}
        {notificationMessage && (
          <div className={`p-4 rounded-lg ${notificationMessage.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {notificationMessage}
          </div>
        )}

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
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-gray-600">{order.customer_email}</p>
                    <p className="text-gray-600">{order.customer_phone || "No phone provided"}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p>{order.street_address}</p>
                      <p>{order.city}, {order.state}</p>
                      <p>{order.postal_code}</p>
                    </div>
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
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(order.total_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
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
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-4">
                {order.order_items.map((item) => (
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

        {/* Update Status */}
        <Card>
          <CardHeader>
            <CardTitle>Update Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updating || !newStatus || newStatus === order.status}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status update..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
  );
}