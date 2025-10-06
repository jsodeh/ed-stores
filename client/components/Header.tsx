import { Menu, ShoppingCart, User, LogOut, Settings, Package, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const { cartItemCount } = useStore();
  const { user, isAuthenticated, signOut, isAdmin, profile, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Log admin status changes
  useEffect(() => {
    if (isAdmin) {
      console.log('🎉 Header: Admin access confirmed');
    }
  }, [isAdmin]);
  
  // Visual indicator for loading state
  if (loading) {
    return (
      <header className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  const handleSignOut = async () => {
    try {
      console.log('🚪 Header: Starting sign out process');
      await signOut();
      console.log('✅ Header: Sign out completed, navigating to home');
      // Only navigate to home after successful sign out
      navigate("/", { replace: true });
    } catch (error) {
      console.error("❌ Header: Error signing out:", error);
      // Don't navigate on error - let the user stay on the current page
    }
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="ED Superstore" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Admin Quick Access Button */}
          {isAdmin && (
            <button 
              onClick={() => navigate("/admin")}
              className="hidden md:flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </button>
          )}
          
          <button 
            className="relative" 
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Menu className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favorites")}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => navigate("/admin")}
                      className="bg-yellow-50 border-l-4 border-yellow-500"
                    >
                      <Settings className="mr-2 h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-700">Admin Dashboard</span>
                      {/* Visual indicator for debugging */}
                      <span className="ml-2 bg-yellow-500 text-white text-xs px-1 rounded">ADMIN</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => setIsAuthModalOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/store")}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>Shop</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favorites")}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}