import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    products, 
    categories, 
    filteredProducts, 
    loading, 
    selectedCategory,
    searchQuery 
  } = useStore();

  if (!import.meta.env.DEV) return null; // Only show in development

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
      >
        Debug {isOpen ? '✕' : '🐛'}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-3 text-lg">Store Debug Panel</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
            </div>
            
            <div>
              <strong>Products:</strong> {products.length} loaded
              {products.length > 0 && (
                <div className="ml-2 text-xs text-gray-600">
                  First: {products[0]?.name}
                </div>
              )}
            </div>
            
            <div>
              <strong>Categories:</strong> {categories.length} loaded
              {categories.length > 0 && (
                <div className="ml-2 space-y-1">
                  {categories.map(cat => (
                    <div key={cat.id} className="text-xs text-gray-600">
                      {cat.icon} {cat.name} ({cat.slug})
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <strong>Filters:</strong>
              <div className="ml-2 text-xs">
                <div>Category: {selectedCategory || 'All'}</div>
                <div>Search: {searchQuery || 'None'}</div>
              </div>
            </div>
            
            <div>
              <strong>Filtered Products:</strong> {filteredProducts.length}
              {filteredProducts.length > 0 && (
                <div className="ml-2 text-xs text-gray-600 max-h-20 overflow-y-auto">
                  {filteredProducts.slice(0, 3).map(product => (
                    <div key={product.id}>
                      • {product.name} ({product.category_name})
                    </div>
                  ))}
                  {filteredProducts.length > 3 && <div>...and {filteredProducts.length - 3} more</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
