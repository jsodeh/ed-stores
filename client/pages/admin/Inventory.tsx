import { useState, useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Product } from "@shared/database.types";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  RotateCcw
} from "lucide-react";

interface InventoryTransaction {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  reason: string;
  created_at: string;
  product?: {
    name: string;
    sku: string;
  };
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Load products with stock info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .order('stock_quantity', { ascending: true });
      
      if (productsError) throw productsError;
      
      // Transform data to match the view structure
      const transformedData = (productsData || []).map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
        category_color: product.categories?.color || null,
        average_rating: 0,
        review_count: 0
      }));
      
      setProducts(transformedData);

      // Load recent inventory transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          products!inner(name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products.filter(product => 
    (product.stock_quantity || 0) < (product.low_stock_threshold || 10)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminPage title="Inventory Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Inventory Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex rounded-lg border">
              <Button
                variant={activeTab === 'stock' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('stock')}
                className="rounded-r-none"
              >
                Stock Levels
              </Button>
              <Button
                variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('transactions')}
                className="rounded-l-none"
              >
                Transactions
              </Button>
            </div>
          </div>
          
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stock Value</p>
                  <p className="text-2xl font-bold">
                    ₦{products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        {activeTab === 'stock' ? (
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Current Stock</th>
                      <th className="text-left p-2">Threshold</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isLowStock = (product.stock_quantity || 0) < (product.low_stock_threshold || 10);
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.image_url || '/placeholder.svg'} 
                                alt={product.name || ''}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-600">{product.category_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="font-mono text-sm">{product.sku}</span>
                          </td>
                          <td className="p-2">
                            <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm text-gray-600">{product.low_stock_threshold}</span>
                          </td>
                          <td className="p-2">
                            <Badge variant={isLowStock ? "destructive" : "default"}>
                              {isLowStock ? 'Low Stock' : 'In Stock'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.product?.name}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.reason || 'No reason provided'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'in' ? 'text-green-600' : 
                        transaction.type === 'out' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'in' ? '+' : transaction.type === 'out' ? '-' : '±'}{transaction.quantity}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPage>
  );
}
