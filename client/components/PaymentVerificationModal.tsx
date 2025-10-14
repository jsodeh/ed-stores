import { useState } from "react";
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
import { supabase, notifications } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send 
} from "lucide-react";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  onPaymentVerified: () => void;
}

export function PaymentVerificationModal({ 
  isOpen, 
  onClose, 
  orderNumber, 
  paymentMethod, 
  amount,
  onPaymentVerified
}: PaymentVerificationModalProps) {
  const { user, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'submitted' | 'verified' | 'rejected'>('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [progress, setProgress] = useState(0);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const handleSubmitVerification = async () => {
    if (!user) return;
    
    try {
      setVerificationStatus('submitted');
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      // Send notification to admins
      await notifications.createAdminNotification(
        "Payment Verification Request",
        `User ${profile?.full_name || user.email} has submitted payment verification for order ${orderNumber}. Payment method: ${paymentMethod}. Amount: ${formatPrice(amount)}.`,
        "payment",
        `/admin/orders?order=${orderNumber}`
      );
      
      // Complete the progress animation
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setVerificationStatus('verified');
        // Don't auto-call onPaymentVerified - let user control when to proceed
      }, 2000);
    } catch (error) {
      console.error('Error submitting payment verification:', error);
      setVerificationStatus('pending');
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
      
      case 'verified':
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Verification Request Submitted!</h3>
              <p className="text-gray-600 mb-4">
                Thank you! Your payment verification request has been submitted successfully. 
                Our team will review and confirm your payment shortly.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">What happens next?</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Our team will verify your payment within 24 hours</li>
                  <li>• You'll receive an email confirmation once verified</li>
                  <li>• Your order will then be processed for delivery</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={onPaymentVerified}
              >
                View Order Details
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Continue Shopping
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