import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ShoppingCart } from "lucide-react";

export default function Cart() {
  return (
    <PlaceholderPage
      title="Shopping Cart"
      description="Your cart items will appear here. Start shopping to add products!"
      icon={<ShoppingCart className="h-8 w-8 text-primary" />}
    />
  );
}
