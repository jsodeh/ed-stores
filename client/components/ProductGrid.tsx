import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductModal } from "./ProductModal";
import { Product } from "@shared/database.types";

export function ProductGrid() {
  const { filteredProducts, addToCart, toggleFavorite, isFavorite, loading, selectedCategory, cartItems, updateCartQuantity } =
    useStore();
  const { isAuthenticated } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show all products on homepage when no category is selected, otherwise limit to 8
  const products = selectedCategory ? filteredProducts.slice(0, 8) : filteredProducts;
  
  console.log('🛍️ ProductGrid: Rendering with state', { 
    loading, 
    productsCount: products.length, 
    filteredProductsCount: filteredProducts.length,
    selectedCategory
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking add button
    const existingCartItem = cartItems.find(item => item.products?.id === product.id);
    if (existingCartItem) {
      updateCartQuantity(product.id, existingCartItem.quantity + 1);
    } else {
      addToCart(product, 1);
    }
  };

  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking favorite
    toggleFavorite(productId);
  };

  const formatPrice = (price: number | null) => {
    return `₦${(price || 0).toLocaleString()}.00`;
  };

  if (loading) {
    console.log('⏳ ProductGrid: Showing loading state');
    return (
      <div className="mx-4 mb-20 text-center py-8">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    console.log('📭 ProductGrid: Showing no products message');
    return (
      <div className="mx-4 mb-20 text-center py-8">
        <p className="text-gray-500">No products found</p>
        <p className="text-sm text-gray-400 mt-2">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  console.log('✅ ProductGrid: Showing products', products.length);
  return (
    <>
      <div className="mx-4 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative mb-3">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name || ""}
                  className="w-full h-32 object-cover rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white"
                  onClick={(e) => handleToggleFavorite(product.id || "", e)}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFavorite(product.id || "")
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                </Button>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">
                  {product.name || "Unnamed Product"}
                </h4>
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
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}