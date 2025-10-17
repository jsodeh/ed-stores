import { useAdminStats } from "@/hooks/useRealtimeData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-lg lg:text-2xl font-bold">{stats?.totalUsers}</p>
                </div>
                <Users className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">
                    Total Products
                  </p>
                  <p className="text-lg lg:text-2xl font-bold">{stats?.totalProducts}</p>
                </div>
                <Package className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-lg lg:text-2xl font-bold">{stats?.totalOrders}</p>
                </div>
                <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-sm lg:text-2xl font-bold">
                    {formatPrice(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="text-center">
                <div className="text-lg lg:text-2xl font-bold text-yellow-600">
                  {stats?.orderStats.pending}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg lg:text-2xl font-bold text-blue-600">
                  {stats?.orderStats.confirmed}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-lg lg:text-2xl font-bold text-green-600">
                  {stats?.orderStats.delivered}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-lg lg:text-2xl font-bold text-red-600">
                  {stats?.orderStats.cancelled}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No orders yet</p>
                    <p className="text-sm">
                      Orders will appear here once customers start purchasing
                    </p>
                  </div>
                ) : (
                  stats?.recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(order.total_amount)}
                        </p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "pending"
                                ? "secondary"
                                : order.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.lowStockProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    All products are well stocked!
                  </p>
                ) : (
                  stats?.lowStockProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Threshold: {product.low_stock_threshold}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {product.stock_quantity} left
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No customers yet</p>
                    <p className="text-sm">
                      Customer registrations will appear here
                    </p>
                  </div>
                ) : (
                  stats?.recentUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">
                          {user.full_name || "Unnamed User"}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  onClick={() => navigate("/admin/products")}
                  className="h-10 lg:h-12 text-sm"
                  variant="outline"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button
                  onClick={() => navigate("/admin/categories")}
                  className="h-10 lg:h-12 text-sm"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
                <Button
                  onClick={() => window.open("/", "_blank")}
                  className="h-10 lg:h-12 text-sm sm:col-span-2 lg:col-span-1"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Store
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
