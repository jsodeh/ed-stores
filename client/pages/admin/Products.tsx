import { useState, useEffect } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase, admin } from "@/lib/supabase";
import { Product } from "@shared/database.types";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let invalidationTimeout: NodeJS.Timeout | null = null;
    
    const debouncedInvalidate = () => {
      if (invalidationTimeout) {
        clearTimeout(invalidationTimeout);
      }
      
      invalidationTimeout = setTimeout(() => {
        console.log('🔄 Debounced invalidation: Refreshing admin products cache');
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }, 1000);
    };

    const channel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('🔄 Products table changed:', payload.eventType);
        debouncedInvalidate();
      })
      .subscribe();

    return () => {
      if (invalidationTimeout) {
        clearTimeout(invalidationTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: products = [], isPending: loading, error } = useQuery<Product[], Error>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      console.log('📦 Fetching admin products...');
      const { data, error } = await admin.getAllProducts();
      
      if (error) {
        console.error('❌ Admin products fetch error:', error);
        throw error;
      }

      console.log('✅ Admin products fetched successfully:', data.length, 'products');
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 2000,
  });

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await admin.deleteProduct(productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeletingProduct(null);
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      alert(`Error deleting product: ${error.message}. Please try again.`);
    },
  });

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}.00`;
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;
    deleteProductMutation.mutate(deletingProduct.id);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading products</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                "Refresh"
              )}
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Total Products</p>
                  <p className="text-lg lg:text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Active Products</p>
                  <p className="text-lg lg:text-2xl font-bold">
                    {products.filter((p) => p.is_active).length}
                  </p>
                </div>
                <Eye className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Low Stock</p>
                  <p className="text-lg lg:text-2xl font-bold">
                    {
                      products.filter(
                        (p) =>
                          (p.stock_quantity || 0) <
                          (p.low_stock_threshold || 10),
                      ).length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products - Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Products ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name || ""}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">
                                {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="font-mono text-sm">{product.sku}</span>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category_name}</Badge>
                        </td>
                        <td className="p-2">
                          <span className="font-semibold">
                            {formatPrice(product.price || 0)}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`font-medium ${
                              (product.stock_quantity || 0) <
                              (product.low_stock_threshold || 10)
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={product.is_active ? "default" : "secondary"}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products - Mobile Cards */}
        <div className="lg:hidden">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Products ({filteredProducts.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="p-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name || ""}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.category_name}
                      </Badge>
                    </div>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-primary">
                        {formatPrice(product.price || 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-medium text-xs ${
                          (product.stock_quantity || 0) <
                          (product.low_stock_threshold || 10)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="flex-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProductForm
            product={editingProduct || undefined}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
