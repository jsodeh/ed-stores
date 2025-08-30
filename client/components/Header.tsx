import { QrCode, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const { cartItemCount } = useStore();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="ED Superstore" 
            className="h-8 w-auto"
          />
        </div>

        <div className="flex items-center gap-4">
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
          
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <QrCode className="h-4 w-4 text-gray-600" />
          </div>
          
          {user ? (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <button 
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <span className="text-white text-xs font-medium">GO</span>
            </button>
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