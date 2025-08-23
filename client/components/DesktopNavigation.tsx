import { Home, Store, Heart, ShoppingCart, User, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/" },
  { id: "store", icon: Store, label: "Store", path: "/store" },
  { id: "favorites", icon: Heart, label: "Favorites", path: "/favorites" },
  { id: "cart", icon: ShoppingCart, label: "Cart", path: "/cart" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

export function DesktopNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="hidden md:flex items-center justify-between p-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold text-primary">ED Superstore</h1>
        
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <LiveSearch className="w-80" />
        
        <Button className="bg-primary hover:bg-primary/90">
          Sign In
        </Button>
      </div>
    </header>
  );
}
