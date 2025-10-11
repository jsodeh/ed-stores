import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Phone, Mail, User, CreditCard } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase, notifications, orders } from "@/lib/supabase";
import { PaymentVerificationModal } from "@/components/PaymentVerificationModal";

export default function Checkout() {
  const { cartItems, cartTotal, deliveryFee, finalTotal, clearCart } = useStore();
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryNotes: "",
  });
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("transfer");

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format price
  const formatPrice = (price: number | null) => {
    return `₦${(price || 0).toLocaleString()}.00`;
  };

  // Handle place order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    
    try {
      // Validate required fields
      if (!formData.address || !formData.city || !formData.state) {
        throw new Error("Please fill in all required address fields");
      }
      
      // Create address record first
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user?.id || null,
          type: "shipping",
          street_address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode || null,
          country: "Nigeria"
        })
        .select()
        .single();
      
      if (addressError) throw addressError;
      
      // Create order from cart using the stored procedure
      const { data: orderData, error: orderError } = await orders.createFromCart(
        user?.id || "",
        addressData.id,
        formData.deliveryNotes || "",
        paymentMethod
      );
      
      if (orderError) throw orderError;
      
      // Get the created order details
      const { data: orderDetails, error: orderDetailsError } = await supabase
        .from("order_details")
        .select("*")
        .eq("id", orderData)
        .single();
      
      if (orderDetailsError) throw orderDetailsError;
      
      // Clear cart
      clearCart();
      
      // Show verification modal for bank transfer payments
      if (paymentMethod === "transfer") {
        setShowVerificationModal(true);
        setOrderDetails(orderDetails);
      } else {
        // Navigate to order confirmation page for cash payments
        navigate("/order-confirmation", {
          state: orderDetails
        });
      }
      
      // Send notification to admins
      await notifications.createAdminNotification(
        "New Order Placed",
        `User ${profile?.full_name || user?.email || 'Guest'} placed a new order (${orderDetails.order_number}) with ${cartItems.length} items. Total: ${formatPrice(orderDetails.total_amount)}. Payment method: ${paymentMethod}.`,
        "order",
        `/admin/orders?order=${orderDetails.order_number}`
      );
    } catch (error) {
      console.error("Error placing order:", error);
      alert(`Failed to place order: ${error.message || "Please try again."}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle payment verified
  const handlePaymentVerified = () => {
    setShowVerificationModal(false);
    navigate("/order-confirmation", {
      state: orderDetails
    });
  };

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>
      
      <main className="max-w-6xl mx-auto p-4 pb-20 md:pb-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6 mb-6 lg:mb-0">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="Postal Code"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                  <Textarea
                    id="deliveryNotes"
                    name="deliveryNotes"
                    placeholder="Any special delivery instructions..."
                    value={formData.deliveryNotes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="transfer"
                      name="paymentMethod"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={() => setPaymentMethod("transfer")}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="transfer" className="font-medium">
                      Bank Transfer
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="cash" className="font-medium">
                      Cash on Pickup
                    </Label>
                  </div>
                </div>

                {/* Payment Information Card */}
                {paymentMethod === "transfer" && (
                  <Card className="border-2 border-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-3">Bank Transfer Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Name:</span>
                          <span className="font-medium">ED Superstore</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-medium">First Bank</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-medium">2045678901</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Amount:</span>
                          <span className="text-primary">{formatPrice(finalTotal)}</span>
                        </div>
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Please make your transfer and keep the receipt for confirmation.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {paymentMethod === "cash" && (
                  <Card className="border-2 border-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-3">Cash on Pickup</h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          You can pay in cash when you pick up your order at our store location.
                        </p>
                        <div className="flex justify-between font-bold text-lg mt-3">
                          <span>Total Amount:</span>
                          <span className="text-primary">{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">
                        {formatPrice((item.products?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
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
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 py-3"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>
                
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>• By placing your order, you agree to our terms and conditions</p>
                  <p>• Secure checkout</p>
                  <p>• 30-day return policy</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Membership Benefits Notice */}
            {!isAuthenticated && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sign up for membership benefits</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get discounts, stock alerts, loyalty bonuses, and payment on delivery.
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 mt-2 h-auto text-primary"
                        onClick={() => navigate("/")}
                      >
                        Sign up now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <BottomNavigation />
      
      {/* Payment Verification Modal */}
      <PaymentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        orderNumber={orderDetails?.orderNumber || ''}
        paymentMethod={orderDetails?.paymentMethod || ''}
        amount={orderDetails?.finalTotal || 0}
        onPaymentVerified={handlePaymentVerified}
      />
    </div>
  );
}