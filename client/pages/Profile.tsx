import { PlaceholderPage } from "@/components/PlaceholderPage";
import { User } from "lucide-react";

export default function Profile() {
  return (
    <PlaceholderPage
      title="Profile"
      description="Manage your account settings, orders, and personal information here."
      icon={<User className="h-8 w-8 text-primary" />}
    />
  );
}
