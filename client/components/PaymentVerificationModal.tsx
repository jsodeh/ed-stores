import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase, notifications } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send,
  Eye,
  X
} from "lucide-react";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  onPaymentVerified: () => void;
  orderId?: string; // Add orderId to track order status
}

export function PaymentVerificationModal({ 
  isOpen, 
  onClose, 
  orderNumber, 
  paymentMethod, 
  amount,
  onPaymentVerified,
  orderId
}: PaymentVerificationModalProps) {
  const { user, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'submitted' | 'waiting_confirmation' | 'confirmed' | 'rejected'>('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [progress, setProgress] = useState(0);
  const [orderStatus, setOrderStatus] = useState<string>('pending');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  // Real-time order status monitoring
  useEffect(() => {
    if (!orderId || !isOpen) return;

    // Initial order status fetch
    const fetchOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status, payment_status')
          .eq('id', orderId)
          .single();

        if (data && !error) {
          setOrderStatus(data.status);
          setPaymentStatus(data.payment_status);
          
          // If order is confirmed, update verification status
          if (data.status === 'confirmed' && verificationStatus === 'waiting_confirmation') {
            setVerificationStatus('confirmed');
          }
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
      }
    };

    fetchOrderStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Order status updated:', payload.new);
          const newOrder = payload.new as any;
          setOrderStatus(newOrder.status);
          setPaymentStatus(newOrder.payment_status);
          
          // Update verification status when order is confirmed
          if (newOrder.status === 'confirmed' && verificationStatus === 'waiting_confirmation') {
            setVerificationStatus('confirmed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, isOpen, verificationStatus]);

  const handleSubmitVerification = async () => {
    if (!user) return;
    
    try {
      setVerificationStatus('submitted');
      setProgress(0);
      
      // Send notification to admins
      await notifications.createAdminNotification(
        "Payment Verification Request",
        `User ${profile?.full_name || user.email} has submitted payment verification for order ${orderNumber}. Payment method: ${paymentMethod}. Amount: ${formatPrice(amount)}.`,
        "payment",
        `/admin/orders?order=${orderNumber}`
      );
      
      // Show progress animation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setVerificationStatus('waiting_confirmation');
            return 100;
          }
          return prev + 20;
        });
      }, 300);
      
    } catch (error) {
      console.error('Error submitting payment verification:', error);
      setVerificationStatus('pending');
      setProgress(0);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Verify Payment</h3>
              <p className="text-gray-600">
                Please confirm that you've made the payment for your order.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{formatPrice(amount)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional information about your payment..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleSubmitVerification}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Verification Request
            </Button>
          </div>
        );
      
      case 'submitted':
        return (
          <div className="space-y-6 text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Submitting Verification Request</h3>
              <p className="text-gray-600 mb-4">
                Please wait while we submit your payment verification request...
              </p>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">
                {progress < 100 ? 'Submitting request...' : 'Request submitted successfully!'}
              </p>
            </div>
          </div>
        );
      
      case 'waiting_confirmation':
        return (
          <div className="space-y-6 text-center">
            <Clock className="h-16 w-16 text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Verification Request Submitted!</h3>
              <p className="text-gray-600 mb-4">
                Thank you! Your payment verification request has been submitted successfully. 
                Our team will review and confirm your payment shortly.
              </p>
              
              {/* Live Order Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Order Status:</span>
                  <Badge variant={orderStatus === 'confirmed' ? 'default' : 'secondary'}>
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                  <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">What happens next?</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Our team will verify your payment within 24 hours</li>
                  <li>• This modal will update automatically when confirmed</li>
                  <li>• Your order will then be processed for delivery</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onPaymentVerified}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Order Details
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        );

      case 'confirmed':
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-700">Payment Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Great news! Your payment has been verified and confirmed by our team. 
                Your order is now being processed.
              </p>
              
              {/* Live Order Status */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Order Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Payment Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Confirmed
                  </Badge>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-left">
                <p className="text-sm text-green-800 font-medium mb-2">✅ What's next?</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your order is now confirmed and being processed</li>
                  <li>• You'll receive updates as your order progresses</li>
                  <li>• Track your order status in the order details page</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onPaymentVerified}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Order Details
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="space-y-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Payment Verification Failed</h3>
              <p className="text-gray-600">
                We couldn't verify your payment. Please check your payment details and try again.
              </p>
            </div>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setVerificationStatus('pending')}
            >
              Try Again
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}