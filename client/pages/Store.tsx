import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProductModal } from "@/components/ProductModal";
import { LiveSearch } from "@/components/LiveSearch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Product } from "@shared/database.types";

const categories = [
  { id: null, name: "All", color: "bg-gray-100" },
  { id: "grocery", name: "Grocery", color: "bg-primary" },
  { id: "bakery", name: "Bakery", color: "bg-pink-100" },
  { id: "veggies", name: "Veggies", color: "bg-green-100" },
  { id: "meat", name: "Meat", color: "bg-red-100" },
];

export default function Store() {
  const { selectedCategory, setSelectedCategory, addToCart, toggleFavorite, isFavorite, filteredProducts } = useStore();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
        </div>

        {/* Search Bar (Mobile) */}
        <div className="md:hidden mb-6">
          <div className="flex gap-3">
            <LiveSearch className="flex-1" />
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full border-gray-200 bg-gray-50 hover:bg-gray-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id || 'all'}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${
                  state.selectedCategory === category.id 
                    ? 'bg-primary text-white' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            {selectedCategory && (
              <span> in <Badge variant="secondary" className="ml-1 capitalize">{selectedCategory}</Badge></span>
            )}
          </p>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              viewMode === 'grid' ? (
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
              ) : (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="flex gap-4">
                    <img 
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                          <Badge variant="secondary" className="mt-1 capitalize">
                            {product.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleFavorite(product.id, e)}
                          className="text-gray-400 hover:text-red-500"
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
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </div>
                        <Button 
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={(e) => handleAddToCart(product, e)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
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
