import { useState, useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Category } from "@shared/database.types";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tags,
  Eye,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminPage title="Categories Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Categories Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Tags className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Categories</p>
                  <p className="text-2xl font-bold">{categories.filter(c => c.is_active).length}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive Categories</p>
                  <p className="text-2xl font-bold">{categories.filter(c => !c.is_active).length}</p>
                </div>
                <Tags className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Slug</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{category.sort_order}</span>
                          <div className="flex flex-col gap-1">
                            <Button variant="outline" size="sm" className="w-6 h-6 p-0">
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="w-6 h-6 p-0">
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: category.color || '#F59E0B' }}
                          >
                            {category.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-gray-600">{category.icon}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-gray-600">
                          {category.description || 'No description'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
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
    </AdminPage>
  );
}
