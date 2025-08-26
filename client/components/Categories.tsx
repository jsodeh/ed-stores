import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";

export function Categories() {
  const { setSelectedCategory, selectedCategory, categories } = useStore();
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    navigate('/store');
  };

  const handleViewAll = () => {
    setSelectedCategory(null);
    navigate('/store');
  };

  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
        <Button variant="ghost" className="text-sm text-primary p-0" onClick={handleViewAll}>
          View All
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              className={`flex flex-col items-center p-3 rounded-2xl transition-colors ${
                isSelected ? 'bg-primary/10' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className={`w-12 h-12 rounded-2xl ${category.color} flex items-center justify-center mb-2`}>
                <IconComponent
                  className={`h-6 w-6 ${category.id === 'grocery' ? 'text-white' : 'text-gray-600'}`}
                />
              </div>
              <span className="text-xs font-medium text-gray-700">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
