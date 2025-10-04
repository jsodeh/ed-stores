import { useState, useEffect } from "react";
import { products, categories } from "@/lib/supabase";

export default function Test() {
  const [productsData, setProductsData] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Test: Loading products and categories");
        
        // Load products and categories in parallel
        const [productsResult, categoriesResult] = await Promise.all([
          products.getAll(),
          categories.getAll()
        ]);
        
        console.log("📦 Test: Products result:", productsResult);
        console.log("📦 Test: Categories result:", categoriesResult);
        
        if (productsResult.error) {
          setError(`Products error: ${productsResult.error.message}`);
        } else {
          setProductsData(productsResult.data || []);
        }
        
        if (categoriesResult.error) {
          setError(prev => prev ? `${prev}; Categories error: ${categoriesResult.error.message}` : `Categories error: ${categoriesResult.error.message}`);
        } else {
          setCategoriesData(categoriesResult.data || []);
        }
      } catch (err) {
        console.error("❌ Test: Error loading data:", err);
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Data Loading</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
          <span>Loading data...</span>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Products ({productsData.length})</h2>
            {productsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsData.slice(0, 6).map((product) => (
                  <div key={product.id} className="border p-4 rounded">
                    <h3 className="font-medium">{product.name || "Unnamed Product"}</h3>
                    <p className="text-gray-600">₦{(product.price || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products found</p>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Categories ({categoriesData.length})</h2>
            {categoriesData.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoriesData.map((category) => (
                  <span key={category.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {category.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No categories found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}