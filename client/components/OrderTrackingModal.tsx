import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { OrderStatus } from "@shared/database.types";
import { 
  ShoppingCart, 
  CheckCircle, 
  Truck, 
  Package,
  Search
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Track Your Order</DialogTitle>
        </DialogHeader>
        
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
            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="font-semibold">
                  ₦{(order.total_amount || 0).toLocaleString()}.00
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
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Pending'}
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
      </DialogContent>
    </Dialog>
  );
}