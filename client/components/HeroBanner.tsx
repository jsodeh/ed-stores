import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <div className="mx-4 mb-6 bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-2">Catchy Title</h2>
        <p className="text-sm opacity-90 mb-4">Use D Product 4 oury</p>
        <Button 
          variant="secondary" 
          className="bg-white text-primary hover:bg-gray-100 text-sm px-6 py-2 rounded-full"
        >
          Shop Now
        </Button>
      </div>
      
      {/* Background woman image */}
      <div className="absolute right-0 top-0 h-full w-1/2">
        <img 
          src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop&crop=face"
          alt="Woman with groceries"
          className="h-full w-full object-cover rounded-r-2xl"
        />
      </div>
    </div>
  );
}
