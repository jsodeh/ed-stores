import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Heart, 
  ShoppingCart, 
  Settings, 
  Bell, 
  CreditCard, 
  HelpCircle,
  LogOut,
  Edit,
  Star
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { orders } from "@/lib/supabase";
import { Order } from "@shared/database.types";

export default function Profile() {
  const { cartItemCount, favoriteProducts, cartTotal } = useStore();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Could navigate to sign-in page or show auth modal
      console.log('User not authenticated, should show sign-in');
    }
  }, [isAuthenticated]);

  // Load user orders when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserOrders();
    } else {
      setOrdersLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadUserOrders = async () => {
    if (!user) return;

    setOrdersLoading(true);
    try {
      const { data, error } = await orders.getUserOrders(user.id);
      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      const ordersList = data || [];
      setUserOrders(ordersList);

      // Calculate total spent from all delivered orders
      const total = ordersList
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      setTotalSpent(total);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const userStats = {
    totalOrders: userOrders.length,
    totalSpent: totalSpent,
    favoriteItems: favoriteProducts.length,
    cartItems: cartItemCount,
  };

  // Get recent orders (last 3)
  const recentOrders = userOrders
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 3);

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesktopNavigation />
        <div className="md:hidden">
          <Header />
        </div>

        <main className="max-w-4xl mx-auto p-4 pb-20 md:pb-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your profile and order history.</p>
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
              Go to Home
            </Button>
          </div>
        </main>

        <BottomNavigation />
      </div>
    );
  }


  const menuItems = [
    { icon: Package, label: "Order History", path: "/orders", count: userStats.totalOrders },
    { icon: Heart, label: "Favorites", path: "/favorites", count: userStats.favoriteItems },
    { icon: ShoppingCart, label: "Shopping Cart", path: "/cart", count: userStats.cartItems },
    { icon: CreditCard, label: "Payment Methods", path: "/payment" },
    { icon: MapPin, label: "Delivery Addresses", path: "/addresses" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-bold">
                  {user?.user_metadata?.full_name ?
                    user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                    user?.email?.slice(0, 2).toUpperCase() || 'U'
                  }
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user?.user_metadata?.full_name || profile?.full_name || 'User'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">Premium Member</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email || 'No email provided'}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {(profile?.city || profile?.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[profile?.city, profile?.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{userStats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{formatPrice(userStats.totalSpent)}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{userStats.favoriteItems}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{userStats.cartItems}</div>
              <div className="text-sm text-gray-600">In Cart</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => item.path && navigate(item.path)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.count !== undefined && item.count > 0 && (
                            <Badge variant="secondary">
                              {item.count}
                            </Badge>
                          )}
                          <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                        </div>
                      </button>
                      {index < menuItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ordersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading orders...</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No orders yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/store')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  recentOrders.map((order, index) => (
                    <div key={order.order_number}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{order.order_number}</span>
                          <Badge
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                            className={order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{new Date(order.created_at || '').toLocaleDateString()}</span>
                          <span>{order.item_count || 0} items</span>
                        </div>
                        <div className="font-semibold text-primary">
                          {formatPrice(order.total_amount || 0)}
                        </div>
                      </div>
                      {index < recentOrders.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sign Out */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
