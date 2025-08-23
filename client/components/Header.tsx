import { QrCode } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white">
      <div className="flex items-center">
        <h1 className="text-lg font-bold text-primary">ED Superstore</h1>
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
