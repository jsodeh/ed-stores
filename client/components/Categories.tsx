import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";

const splitCategoryName = (name: string): string[] => {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) {
    return [name];
  }

  const midpoint = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, midpoint).join(" ");
  const secondLine = words.slice(midpoint).join(" ");

  return secondLine ? [firstLine, secondLine] : [firstLine];
};

export function Categories() {
  const { setSelectedCategory, selectedCategory, categories } = useStore();
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    navigate("/store");
  };

  const handleViewAll = () => {
    setSelectedCategory(null);
    navigate("/store");
  };

  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
        <Button
          variant="ghost"
          className="text-sm text-primary p-0"
          onClick={handleViewAll}
        >
          View All
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.length === 0
          ? // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 rounded-2xl min-w-[80px] flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))
          : categories.map((category) => {
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.id}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-colors min-w-[80px] flex-shrink-0 ${
                    isSelected ? "bg-primary/10" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleCategoryClick(category.slug || "")}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-white text-lg"
                    style={{ backgroundColor: category.color || "#F59E0B" }}
                  >
                    {category.icon || "📦"}
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {splitCategoryName(category.name).map((line, index) => (
                      <span key={index} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
      </div>
    </div>
  );
}
