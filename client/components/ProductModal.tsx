import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { Product } from "@shared/database.types";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart, toggleFavorite, isFavorite, cartItems } = useStore();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    onClose();
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const existingCartItem = state.cart.find(item => item.product.id === product.id);
  const cartQuantity = existingCartItem?.quantity || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Image */}
          <div className="relative">
            <img 
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart 
                className={`h-5 w-5 ${
                  isFavorite(product.id) 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400'
                }`} 
              />
            </Button>
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {product.category}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(product.price)}
                </div>
                {product.stock && (
                  <div className="text-sm text-gray-500">
                    {product.stock} in stock
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Current cart status */}
            {cartQuantity > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  {cartQuantity} item{cartQuantity > 1 ? 's' : ''} already in cart
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Quantity:</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
