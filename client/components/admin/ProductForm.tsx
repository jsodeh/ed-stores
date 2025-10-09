import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Product, Category } from "@shared/database.types";
import { X, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    sku: "",
    stock_quantity: "",
    low_stock_threshold: "10",
    is_active: true,
    is_featured: false,
    image_url: "",
    weight: "",
    tags: "",
  });

  useEffect(() => {
    loadCategories();
    if (product) {
      console.log('📝 ProductForm: Initializing form with product data:', product);
      const initialFormData = {
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        category_id: product.category_id || "",
        sku: product.sku || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        low_stock_threshold: product.low_stock_threshold?.toString() || "10",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        image_url: product.image_url || "",
        weight: product.weight?.toString() || "",
        tags: product.tags?.join(", ") || "",
      };
      console.log('📝 ProductForm: Initial form data:', initialFormData);
      setFormData(initialFormData);
    }
  }, [product]);

  const loadCategories = async () => {
    console.log('📂 ProductForm: Loading categories...');
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    console.log('📂 ProductForm: Categories loaded:', data?.length || 0);
    setCategories(data || []);
  };

  const generateSKU = () => {
    const category = categories.find((c) => c.id === formData.category_id);
    if (category) {
      const prefix =
        category.slug
          ?.split("-")
          .map((part) => part.charAt(0).toUpperCase())
          .join("") || "PRD";
      const timestamp = Date.now().toString().slice(-4);
      setFormData((prev) => ({ ...prev, sku: `${prefix}-${timestamp}` }));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      console.log('🖼️ ProductForm: Starting image upload...', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type 
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('📤 ProductForm: Uploading file to storage...', { fileName });
      
      // Upload directly since bucket exists
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ ProductForm: Supabase storage upload error:', error);
        
        if (error.message?.includes('row-level security') || error.message?.includes('permission')) {
          alert('Storage permissions not configured. Please run the setup-storage-policies.sql script in your Supabase SQL Editor, then try again. You can also enter the image URL manually below.');
        } else if (error.message?.includes('duplicate')) {
          // File already exists, try with a different name
          const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-retry.${fileExt}`;
          console.log('🔄 ProductForm: File exists, retrying with new name:', newFileName);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('product-images')
            .upload(newFileName, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            console.error('❌ ProductForm: Retry upload failed:', retryError);
            alert(`Error uploading image: ${retryError.message}. You can enter the image URL manually below.`);
            return null;
          }
          
          // Get public URL for retry
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(newFileName);
            
          console.log('✅ ProductForm: Retry upload successful, public URL:', publicUrl);
          return publicUrl;
        } else {
          alert(`Error uploading image: ${error.message || 'Unknown error'}. You can enter the image URL manually below.`);
        }
        return null;
      }

      console.log('✅ ProductForm: Upload successful, getting public URL...', { data });
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('🔗 ProductForm: Public URL retrieved:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('❌ ProductForm: Unexpected error uploading image:', error);
      alert(`Unexpected error uploading image: ${error.message || error || 'Unknown error'}. You can enter the image URL manually below.`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected for upload:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please select an image smaller than 5MB.');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      console.log('🖼️ ProductForm: Image uploaded successfully:', { imageUrl });
      console.log('🖼️ ProductForm: Updating form data with image URL');
      setFormData((prev) => {
        const updated = { ...prev, image_url: imageUrl };
        console.log('🖼️ ProductForm: Form data after image update:', updated);
        return updated;
      });
    } else {
      console.log('❌ ProductForm: Image upload failed');
    }
  };

  const mutation = useMutation({
    mutationFn: async (productData: any) => {
      if (product) {
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      onSave();
    },
    onError: (error) => {
      console.error("Error saving product:", error);
      alert("Error saving product. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category_id: formData.category_id,
      sku: formData.sku,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      image_url: formData.image_url || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      updated_at: new Date().toISOString(),
    };
    mutation.mutate(productData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{product ? "Edit Product" : "Add New Product"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stock_quantity: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    low_stock_threshold: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  }
                />
                <Button type="button" variant="outline" onClick={generateSKU}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex flex-col gap-2">
              {/* Image Preview */}
              {formData.image_url && (
                <div className="relative w-32 h-32">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                    onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                {uploading && (
                  <span className="text-sm text-blue-600 ml-2">
                    Please wait... (This may take a moment)
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {formData.image_url ? "Replace image" : "No image selected"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, GIF up to 5MB
              </p>
            </div>
            
            {/* Fallback URL input (hidden by default but can be shown if needed) */}
            <div className="mt-2">
              <Label htmlFor="image_url" className="text-sm font-medium">
                Or enter image URL
              </Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                }
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="organic, premium, imported"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_featured: checked }))
                  }
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isLoading || uploading} className="flex-1">
              {mutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {product ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}