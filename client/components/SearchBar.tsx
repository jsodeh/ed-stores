import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveSearch } from "./LiveSearch";

export function SearchBar() {
  return (
    <div className="mx-4 mb-6 flex gap-3">
      <LiveSearch className="flex-1" />
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
