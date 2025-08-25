import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProductModal } from "@/components/ProductModal";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Product } from "@shared/database.types";

export default function Favorites() {
  const { favoriteProducts, addToCart, toggleFavorite, isFavorite } = useStore();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favoriteProducts = state.products.filter(product => 
    state.favorites.includes(product.id)
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(productId);
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesktopNavigation />
        <div className="md:hidden">
          <Header />
        </div>
        
        <main className="flex-1 flex items-center justify-center p-8 pb-20 md:pb-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h1>
            <p className="text-gray-600 mb-6">Start adding products to your wishlist by tapping the heart icon!</p>
            <Button 
              onClick={() => navigate('/store')}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Products
            </Button>
          </div>
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>
      
      <main className="max-w-7xl mx-auto p-4 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            My Favorites ({favoriteProducts.length} item{favoriteProducts.length !== 1 ? 's' : ''})
          </h1>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative mb-3">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white"
                  onClick={(e) => handleToggleFavorite(product.id, e)}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isFavorite(product.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                <p className="text-xs text-gray-500 mb-2 capitalize">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <Button 
                    size="icon" 
                    className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <span className="text-white text-lg">+</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => navigate('/store')}
              className="border-primary text-primary hover:bg-primary/10"
            >
              Browse More Products
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Add all favorites to cart
                favoriteProducts.forEach(product => addToCart(product));
                navigate('/cart');
              }}
              className="border-primary text-primary hover:bg-primary/10"
            >
              Add All to Cart
            </Button>
          </div>
        </div>
      </main>
      
      <BottomNavigation />

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
