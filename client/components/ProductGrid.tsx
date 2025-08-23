import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const products = [
  {
    id: "1",
    name: "Onions",
    price: 8300,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop",
    isFavorite: true,
  },
  {
    id: "2", 
    name: "Meat",
    price: 22000,
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=200&fit=crop",
    isFavorite: true,
  },
  {
    id: "3",
    name: "Tomatoes",
    price: 5500,
    image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=200&fit=crop",
    isFavorite: false,
  },
  {
    id: "4",
    name: "Rice",
    price: 15000,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop",
    isFavorite: false,
  },
];

export function ProductGrid() {
  const [favorites, setFavorites] = useState<string[]>(
    products.filter(p => p.isFavorite).map(p => p.id)
  );

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  return (
    <div className="mx-4 mb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
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
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    favorites.includes(product.id) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-400'
                  }`} 
                />
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                <Button size="icon" className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90">
                  <span className="text-white text-lg">+</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
