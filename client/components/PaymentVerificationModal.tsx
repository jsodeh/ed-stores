import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Send,
  X
} from "lucide-react";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  orderId?: string; // Add orderId to track order status
}

export function PaymentVerificationModal({ 
  isOpen, 
  onClose, 
  orderNumber, 
  paymentMethod, 
  amount,
  orderId
}: PaymentVerificationModalProps) {
  const [verificationNotes, setVerificationNotes] = useState('');

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔄 PaymentVerificationModal: Dialog onOpenChange called with:', open);
      if (!open) {
        console.log('🔄 PaymentVerificationModal: Calling onClose()');
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
        </DialogHeader>
        <div className="py-4">
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
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => {}}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Verification
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
        </div>
      </DialogContent>
    </Dialog>
  );
}