import { Header } from "./Header";
import { DesktopNavigation } from "./DesktopNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>

      <main className="flex-1 flex items-center justify-center p-8 pb-20 md:pb-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon || <Package className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{description}</p>
          <Button variant="outline" className="text-primary border-primary">
            Coming Soon
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
