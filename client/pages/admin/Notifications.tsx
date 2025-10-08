import { useState, useEffect, useRef } from "react";
import { AdminPage } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, notifications } from "@/lib/supabase";
import {
  Bell,
  Check,
  X,
  User,
  ShoppingCart,
  CreditCard,
  Package,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export default function AdminNotifications() {
  const [notificationsData, setNotificationsData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>('all');
  const loadingRef = useRef(false);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel('admin-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔄 Notifications: Real-time update received:', payload);
          // Only reload if we're not already loading
          if (!loadingRef.current) {
            loadNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Notifications: Unsubscribing from real-time updates');
      notificationsSubscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await notifications.getAdminNotifications();
      if (error) throw error;
      setNotificationsData(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await notifications.markAsRead(notificationId);
      if (error) throw error;
      
      setNotificationsData(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // We need to mark each notification individually since we don't have a user ID here
      const unreadNotifications = notificationsData.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(notification => 
          notifications.markAsRead(notification.id)
        )
      );
      
      setNotificationsData(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'order':
        return <Package className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTypeVariant = (type: string) => {
    switch (type) {
      case 'cart':
        return 'secondary';
      case 'order':
        return 'default';
      case 'payment':
        return 'destructive';
      case 'user':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredNotifications = notificationsData.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const unreadCount = notificationsData.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <AdminPage title="Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Notifications">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="cart">Cart</option>
              <option value="order">Order</option>
              <option value="payment">Payment</option>
              <option value="user">User</option>
            </select>
          </div>
          <Button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Mark All as Read
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{notificationsData.length}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {notificationsData.filter(n => n.type === 'order').length}
              </div>
              <div className="text-sm text-gray-600">Orders</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Notifications will appear here when users take actions'}
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${
                          !notification.is_read ? 'bg-primary/10' : 'bg-gray-100'
                        }`}>
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <span className="font-medium">
                          {notification.title}
                        </span>
                        <Badge variant={getNotificationTypeVariant(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <Button variant="outline" size="sm" className="text-xs">
                        View Details
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}