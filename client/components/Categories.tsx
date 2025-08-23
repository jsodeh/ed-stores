import { ShoppingCart, Cake, Carrot, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "grocery", name: "Grocery", icon: ShoppingCart, color: "bg-primary" },
  { id: "bakery", name: "Bakery", icon: Cake, color: "bg-pink-100" },
  { id: "veggies", name: "Veggies", icon: Carrot, color: "bg-green-100" },
  { id: "meat", name: "Meat", icon: Beef, color: "bg-red-100" },
];

export function Categories() {
  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
        <Button variant="ghost" className="text-sm text-primary p-0">
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors"
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
