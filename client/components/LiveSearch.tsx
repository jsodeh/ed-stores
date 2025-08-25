import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@shared/database.types";

interface LiveSearchProps {
  className?: string;
}

export function LiveSearch({ className }: LiveSearchProps) {
  const { searchQuery, setSearchQuery, setSelectedCategory, products } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (localQuery.trim()) {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(localQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(localQuery.toLowerCase())
      ).slice(0, 5); // Show top 5 suggestions
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [localQuery, products]);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    setSearchQuery(value);
  };

  const handleSuggestionClick = (product: Product) => {
    setLocalQuery(product.name);
    setSearchQuery(product.name);
    setIsOpen(false);
    navigate('/store');
  };

  const handleSearch = () => {
    if (localQuery.trim()) {
      navigate('/store');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => localQuery.trim() && suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search products..."
          className="pl-10 pr-20 py-3 rounded-full border border-gray-200 focus:border-primary bg-gray-50"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full hover:bg-gray-200"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-full hover:bg-gray-200"
            onClick={handleSearch}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-gray-500 font-medium px-3 py-2 uppercase tracking-wide">
              Product Suggestions
            </p>
            {suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSuggestionClick(product)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                </div>
                <div className="text-primary font-semibold">
                  {formatPrice(product.price)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
