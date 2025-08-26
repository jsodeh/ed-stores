import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { HeroBanner } from "@/components/HeroBanner";
import { SearchBar } from "@/components/SearchBar";
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function Index() {
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
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50">
                    Track Your Order
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50">
                    Help & Support
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50">
                    My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
