import { Home, Store, Heart, ShoppingCart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiveSearch } from "./LiveSearch";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";

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
  const { user, signOut } = useAuth();
  const { cartItemCount } = useStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <header className="hidden md:flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-8">
          <img 
            src="/logo.png" 
            alt="ED Superstore" 
            className="h-10 w-auto"
          />
          
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
                  {item.id === "cart" && cartItemCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <LiveSearch className="w-80" />
          
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hi, {user.email?.split('@')[0]}</span>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign In
            </Button>
          )}
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}