import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase, orders } from "@/lib/supabase";
import { OrderStatus, Order } from "@shared/database.types";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ShoppingCart, 
  CheckCircle, 
  Truck, 
  Package,
  Search,
  ArrowLeft,
  Clock,
  XCircle
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'search' | 'details'>('list'); // Default to list for authenticated users

  // Load user orders when modal opens and user is authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      loadUserOrders();
      setView('list');
    } else if (isOpen && !isAuthenticated) {
      setView('search');
    }
  }, [isOpen, isAuthenticated, user]);

  const loadUserOrders = async () => {
    if (!user) return;

    setLoadingUserOrders(true);
    try {
      const { data, error } = await orders.getUserOrders(user.id);
      if (error) throw error;
      
      // Sort by created date, most recent first
      const sortedOrders = (data || []).sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setUserOrders(sortedOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const handleOrderSelect = (selectedOrder: Order) => {
    setOrder(selectedOrder);
    setView('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("order_details")
        .select("*")
        .eq("order_number", orderNumber.trim())
        .single();

      if (error) throw error;
      if (!data) {
        setError("Order not found. Please check your order number.");
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Order not found. Please check your order number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: OrderStatus | null) => {
    switch (status) {
      case "delivered":
        return 5;
      case "shipped":
        return 4;
      case "processing":
        return 3;
      case "confirmed":
        return 2;
      case "pending":
      default:
        return 1;
    }
  };

  const getStatusIcon = (step: number, currentStep: number) => {
    if (step <= currentStep) {
      return <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">{getStepIcon(step)}</div>;
    }
    return <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">{getStepIcon(step)}</div>;
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <ShoppingCart className="h-4 w-4" />;
      case 2:
        return <CheckCircle className="h-4 w-4" />;
      case 3:
        return <Package className="h-4 w-4" />;
      case 4:
        return <Truck className="h-4 w-4" />;
      case 5:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getStatusBadgeIcon = (status: string) => {
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

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view === 'details' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView(isAuthenticated ? 'list' : 'search')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {view === 'details' ? 'Order Tracking' : 'Track Your Order'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        {/* User Orders List View */}
        {view === 'list' && isAuthenticated && (
          <div className="space-y-4 py-4">
            {loadingUserOrders ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userOrders.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Select an order to track its status:
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {userOrders.map((userOrder) => (
                    <div
                      key={userOrder.id}
                      onClick={() => handleOrderSelect(userOrder)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {userOrder.order_number}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusBadgeIcon(userOrder.status || 'pending')}
                          <Badge variant={getStatusVariant(userOrder.status || 'pending') as any} className="text-xs">
                            {userOrder.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatDate(userOrder.created_at || '')}</span>
                        <span className="font-semibold">
                          {formatPrice(userOrder.total_amount || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setView('search')}
                    className="w-full text-sm"
                  >
                    Track a different order
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No orders found</p>
                <Button
                  variant="outline"
                  onClick={() => setView('search')}
                  className="w-full"
                >
                  Track order by number
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Search View */}
        {view === 'search' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="order-number">Order Number</Label>
              <div className="relative mt-1">
                <Input
                  id="order-number"
                  placeholder="Enter your order number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3"
                  disabled={loading}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {order && !loading && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="font-semibold">
                    {formatPrice(order.total_amount || 0)}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setView('details');
                  }}
                  className="w-full"
                >
                  View Tracking Details
                </Button>
              </div>
            )}
            
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </form>
        )}

        {/* Order Details/Tracking View */}
        {view === 'details' && order && (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Order #{order.order_number}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="font-semibold">
                {formatPrice(order.total_amount || 0)}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                
                {/* Steps */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(1, getStatusStep(order.status))}
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-500">
                        {order.created_at ? formatDate(order.created_at) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusIcon(2, getStatusStep(order.status))}
                    <div>
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-gray-500">
                        {getStatusStep(order.status) >= 2 ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusIcon(3, getStatusStep(order.status))}
                    <div>
                      <p className="font-medium">Payment Verified</p>
                      <p className="text-sm text-gray-500">
                        {getStatusStep(order.status) >= 3 ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusIcon(4, getStatusStep(order.status))}
                    <div>
                      <p className="font-medium">Order Out for Delivery</p>
                      <p className="text-sm text-gray-500">
                        {getStatusStep(order.status) >= 4 ? 'In transit' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusIcon(5, getStatusStep(order.status))}
                    <div>
                      <p className="font-medium">Delivery Completed</p>
                      <p className="text-sm text-gray-500">
                        {getStatusStep(order.status) >= 5 ? 'Delivered' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}