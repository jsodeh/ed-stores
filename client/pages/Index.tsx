import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { SearchBar } from "@/components/SearchBar";
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-16 md:pb-0">
        <HeroBanner />
        <SearchBar />
        <Categories />
        <ProductGrid />
      </main>
      <BottomNavigation />
    </div>
  );
}
