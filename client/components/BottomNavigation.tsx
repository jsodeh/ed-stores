import { Home, Store, Heart, ShoppingCart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";

const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/" },
  { id: "store", icon: Store, label: "Store", path: "/store" },
  { id: "favorites", icon: Heart, label: "Favorites", path: "/favorites" },
  { id: "cart", icon: ShoppingCart, label: "Cart", path: "/cart" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemCount } = useApp();
  const cartCount = getCartItemCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-3 px-2 relative ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <IconComponent className="h-5 w-5 mb-1" />
                {item.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
