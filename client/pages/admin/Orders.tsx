import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { Order } from "@shared/database.types";
import {
  Search,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Bell
} from "lucide-react";

export default function AdminOrders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const { data: orders = [], isPending: loading, error } = useAdminOrders();

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Detect new orders and show alert
  useEffect(() => {
    if (orders.length > previousOrderCount && previousOrderCount > 0) {
      const newOrderCount = orders.length - previousOrderCount;
      setShowNewOrderAlert(true);
      
      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => {
        setShowNewOrderAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    setPreviousOrderCount(orders.length);
  }, [orders.length, previousOrderCount]);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'confirmed':
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading orders</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* New Order Alert */}
        {showNewOrderAlert && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-medium">New order(s) received!</span>
            <span className="text-sm">The orders list has been updated.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewOrderAlert(false)}
              className="ml-auto text-green-700 hover:text-green-800"
            >
              ×
            </Button>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-lg lg:text-2xl font-bold">{orderStats.total}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total Orders</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-lg lg:text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
              <div className="text-xs lg:text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card className="sm:col-span-1 lg:col-span-1">
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-lg lg:text-2xl font-bold text-blue-600">{orderStats.processing}</div>
              <div className="text-xs lg:text-sm text-gray-600">Processing</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-lg lg:text-2xl font-bold text-green-600">{orderStats.delivered}</div>
              <div className="text-xs lg:text-sm text-gray-600">Delivered</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-lg lg:text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
              <div className="text-xs lg:text-sm text-gray-600">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders - Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-600">{order.item_count} items</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{order.customer_name || 'Guest'}</p>
                            <p className="text-sm text-gray-600">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="font-semibold">{formatPrice(order.total_amount || 0)}</span>
                        </td>
                        <td className="p-2">
                          <Badge variant={getStatusBadgeVariant(order.status || 'pending')} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(order.status || 'pending')}
                            {order.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className="text-sm text-gray-600">
                            {order.created_at ? formatDate(order.created_at) : 'Unknown'}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/admin/order/${order.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/admin/order/${order.id}`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders - Mobile Cards */}
        <div className="lg:hidden">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Orders ({filteredOrders.length})</h3>
          </div>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-3">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{order.order_number}</h4>
                      <p className="text-xs text-gray-500">{order.item_count} items</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status || 'pending')} className="flex items-center gap-1 text-xs">
                      {getStatusIcon(order.status || 'pending')}
                      {order.status || 'pending'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Customer</div>
                      <div className="font-medium truncate">{order.customer_name || 'Guest'}</div>
                      <div className="text-gray-500 text-xs truncate">{order.customer_email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 text-xs">Total</div>
                      <div className="font-semibold text-primary">{formatPrice(order.total_amount || 0)}</div>
                      <div className="text-gray-500 text-xs">
                        {order.created_at ? formatDate(order.created_at) : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/admin/order/${order.id}`)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/admin/order/${order.id}`)}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
  );
}
