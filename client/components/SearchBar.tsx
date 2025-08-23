import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  return (
    <div className="mx-4 mb-6 flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search"
          className="pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:border-primary bg-gray-50"
        />
      </div>
      <Button 
        variant="outline" 
        size="icon"
        className="rounded-full border-gray-200 bg-gray-50 hover:bg-gray-100"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
