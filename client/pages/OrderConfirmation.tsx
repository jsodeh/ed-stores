import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Home, ShoppingCart, CreditCard } from "lucide-react";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state as any;

  const formatPrice = (price: number | null) => {
    return `₦${(price || 0).toLocaleString()}.00`;
  };

  if (!orderData) {
    // If no order data, redirect to home
    navigate("/");
    return null;
  }

  const {
    orderNumber,
    paymentMethod,
    cartTotal,
    deliveryFee,
    finalTotal,
    fullName,
    email,
    phone,
    address,
    city,
    state,
  } = orderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>
      
      <main className="max-w-4xl mx-auto p-4 pb-20 md:pb-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Order Number</p>
                    <p className="text-gray-600">{orderNumber}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Processing
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">
                      {paymentMethod === 'transfer' ? 'Bank Transfer' : 'Cash on Pickup'}
                    </span>
                  </div>
                </div>
                
                {paymentMethod === 'transfer' && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-1">Next Steps</h4>
                    <p className="text-sm text-yellow-700">
                      Please complete your bank transfer using the details provided during checkout. 
                      Once transferred, verify your payment using the link in your email.
                    </p>
                  </div>
                )}
                
                {paymentMethod === 'cash' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Next Steps</h4>
                    <p className="text-sm text-blue-700">
                      Bring the exact amount in cash when picking up your order. 
                      You'll receive a pickup confirmation email with details.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{fullName}</p>
                  <p className="text-gray-600">{email}</p>
                  <p className="text-gray-600">{phone}</p>
                  <p className="text-gray-600">
                    {address}, {city}, {state}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                  </div>
                  {deliveryFee === 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      🎉 Free delivery on orders over ₦50,000
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate("/")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/profile")}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Order confirmation sent to your email</li>
                  <li>• We'll process your order within 24 hours</li>
                  <li>• Delivery within 3-5 business days</li>
                  <li>• Track your order in your profile</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}