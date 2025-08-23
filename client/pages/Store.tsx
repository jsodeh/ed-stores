import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Store as StoreIcon } from "lucide-react";

export default function Store() {
  return (
    <PlaceholderPage
      title="Store"
      description="Browse our full catalog of products and categories. Coming soon!"
      icon={<StoreIcon className="h-8 w-8 text-primary" />}
    />
  );
}
