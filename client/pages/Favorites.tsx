import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Heart } from "lucide-react";

export default function Favorites() {
  return (
    <PlaceholderPage
      title="Favorites"
      description="Your favorite products will appear here. Start adding items to your wishlist!"
      icon={<Heart className="h-8 w-8 text-primary" />}
    />
  );
}
