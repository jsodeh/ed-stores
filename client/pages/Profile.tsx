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
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { cartItemCount, favoriteProducts } = useStore();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const userStats = {
    totalOrders: 12,
    totalSpent: 485000,
    favoriteItems: state.favorites.length,
    cartItems: getCartItemCount(),
  };

  const recentOrders = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      status: "delivered",
      total: 22500,
      items: 3
    },
    {
      id: "ORD-002", 
      date: "2024-01-10",
      status: "delivered",
      total: 18300,
      items: 2
    },
    {
      id: "ORD-003",
      date: "2024-01-05",
      status: "processing",
      total: 31200,
      items: 5
    }
  ];

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
                <span className="text-white text-xl font-bold">GO</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Guest User</h2>
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
                    <span>guest@edsuperstore.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>+234 801 234 5678</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Abuja, Nigeria</span>
                  </div>
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
                {recentOrders.map((order, index) => (
                  <div key={order.id}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{order.id}</span>
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          className={order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{new Date(order.date).toLocaleDateString()}</span>
                        <span>{order.items} items</span>
                      </div>
                      <div className="font-semibold text-primary">
                        {formatPrice(order.total)}
                      </div>
                    </div>
                    {index < recentOrders.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sign Out */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
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
