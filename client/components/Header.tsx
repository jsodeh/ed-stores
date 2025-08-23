import { MapPin, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  location?: string;
}

export function Header({ location = "Abuja, Nigeria" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-white">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Location</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-gray-900">{location}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <QrCode className="h-4 w-4 text-gray-600" />
        </div>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">GO</span>
        </div>
      </div>
    </header>
  );
}
