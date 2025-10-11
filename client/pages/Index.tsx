import { useState } from "react";
import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { HeroBanner } from "@/components/HeroBanner";
import { SearchBar } from "@/components/SearchBar";
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { BottomNavigation } from "@/components/BottomNavigation";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";
import { HelpSupportModal } from "@/components/HelpSupportModal";
import { QuickActionsButton } from "@/components/QuickActionsButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>

      <main className="pb-16 md:pb-0 max-w-7xl mx-auto">
        <div className="md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-8 md:p-6">
          <div className="lg:col-span-2">
            <HeroBanner />
            <div className="md:hidden">
              <SearchBar />
            </div>
            <Categories />
            <ProductGrid />
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl p-6 mb-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50"
                    onClick={() => setShowOrderTracking(true)}
                  >
                    Track Your Order
                  </button>
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50"
                    onClick={() => setShowHelpSupport(true)}
                  >
                    Help & Support
                  </button>
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50"
                    onClick={() => navigate('/profile')}
                  >
                    My Account
                  </button>
                  {isAdmin && (
                    <button 
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 bg-yellow-50 text-yellow-600"
                      onClick={() => navigate('/admin')}
                    >
                      Admin Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
      


      {/* Modals */}
      <OrderTrackingModal
        isOpen={showOrderTracking}
        onClose={() => setShowOrderTracking(false)}
      />
      <HelpSupportModal
        isOpen={showHelpSupport}
        onClose={() => setShowHelpSupport(false)}
      />
    </div>
  );
}