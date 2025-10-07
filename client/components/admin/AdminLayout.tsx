import { useState, useEffect, useMemo, useContext, createContext, type ReactNode } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuthGuard, useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Tags,
  Warehouse,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Bell
} from "lucide-react";

const adminMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/admin" },
  { id: "products", label: "Products", icon: Package, path: "/admin/products" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "orders", label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { id: "categories", label: "Categories", icon: Tags, path: "/admin/categories" },
  { id: "inventory", label: "Inventory", icon: Warehouse, path: "/admin/inventory" },
  { id: "messages", label: "Messages", icon: MessageSquare, path: "/admin/messages" },
  { id: "notifications", label: "Notifications", icon: Bell, path: "/admin/notifications" },
];

const AdminLayoutContext = createContext<{
  setPageTitle: (title: string | null) => void;
} | null>(null);

const getDefaultTitle = (path: string) => {
  if (path === "/admin") {
    return "Admin Dashboard";
  }

  if (path.startsWith("/admin/order/")) {
    return "Order Details";
  }

  const matchedItem = adminMenuItems.find((item) => path.startsWith(item.path));
  return matchedItem?.label ?? "Admin Dashboard";
};

interface AdminLayoutProps {
  children?: React.ReactNode; // Optional children for flexibility
  title?: string;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState<string | null>(title ?? null);

  useEffect(() => {
    if (title !== undefined) {
      setPageTitle(title ?? null);
    }
  }, [title]);

  const resolvedTitle = useMemo(() => {
    return pageTitle ?? title ?? getDefaultTitle(location.pathname);
  }, [location.pathname, pageTitle, title]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentPath = location.pathname;

  return (
    <AuthGuard requireAuth requireAdmin>
      <AdminLayoutContext.Provider value={{ setPageTitle }}>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar */}
          <div className={`
            w-64 bg-white shadow-lg flex-shrink-0
            lg:block
            ${sidebarOpen ? 'block' : 'hidden lg:block'}
          `}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ED</span>
                  </div>
                  <span className="font-bold text-lg">Admin Panel</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {adminMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:text-primary'
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              {/* User Info */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.full_name?.slice(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {profile?.full_name || 'Admin User'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {profile?.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {resolvedTitle}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    ED Superstore Admin
                  </Badge>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="p-4 lg:p-6">
              {children ?? <Outlet />}
            </main>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </AdminLayoutContext.Provider>
    </AuthGuard>
  );
}

const useAdminLayoutContext = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error("useAdminLayoutContext must be used within AdminLayout");
  }
  return context;
};

export const useAdminPageTitle = (title: string | null) => {
  const { setPageTitle } = useAdminLayoutContext();

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [setPageTitle, title]);
};

export function AdminPage({ title, children }: AdminLayoutProps) {
  useAdminPageTitle(title ?? null);
  return <>{children}</>;
}
