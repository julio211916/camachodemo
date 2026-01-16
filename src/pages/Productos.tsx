import { useState, useEffect } from "react";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, Grid, List, Star, Heart, ShoppingCart, Filter, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  retail_price: number;
  cost_price: number;
  images: string[];
  category_id: string | null;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Productos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("categoria"));
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("destacados");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("*").eq("is_active", true);
    
    if (selectedCategory) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", selectedCategory)
        .single();
      
      if (cat) {
        query = query.eq("category_id", cat.id);
      }
    }

    const { data, error } = await query.limit(50);
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryName = categories.find(c => c.slug === selectedCategory)?.name || "Todos los Productos";

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-white">
      <NewHeader />
      
      {/* Header Banner */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          >
            {categoryName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Descubre nuestra amplia gama de productos naturales elaborados con fórmulas tradicionales mexicanas.
          </motion.p>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-white">Categorías</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchParams({});
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    Todos los Productos
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        setSearchParams({ categoria: category.slug });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.slug ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3 text-white">Rango de Precio</h3>
                <div className="space-y-2">
                  {["$0 - $50", "$50 - $100", "$100 - $150", "$150+"].map((range) => (
                    <label key={range} className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-white">
                      <Checkbox
                        checked={priceRange.includes(range)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPriceRange([...priceRange, range]);
                          } else {
                            setPriceRange(priceRange.filter((r) => r !== range));
                          }
                        }}
                        className="border-white/30"
                      />
                      {range}
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="font-semibold mb-3 text-white">Marcas</h3>
                <div className="space-y-2">
                  {["AJOLOTIUS", "BRONCOPLUS", "Productos Camacho"].map((brand) => (
                    <label key={brand} className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-white">
                      <Checkbox className="border-white/30" />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <Button
                variant="outline"
                className="lg:hidden border-white/20 text-white"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>

              <div className="flex items-center gap-4 ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                >
                  <option value="destacados">Destacados</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="nombre">Nombre A-Z</option>
                </select>

                <div className="flex border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-primary text-white" : "bg-white/5 text-gray-400"}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-primary text-white" : "bg-white/5 text-gray-400"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <span className="text-gray-400 text-sm hidden sm:inline">
                  {filteredProducts.length} productos
                </span>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                    <div className="aspect-square bg-white/10 rounded-xl mb-4" />
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"} gap-4`}>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300 ${
                      viewMode === "list" ? "flex gap-4" : ""
                    }`}
                  >
                    <div className={`${viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-square"} relative mb-4 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden`}>
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="text-gray-500 text-center p-4">
                          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <span className="text-xs">Sin imagen</span>
                        </div>
                      )}
                      {product.is_featured && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          Destacado
                        </span>
                      )}
                      <button className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                        <Heart className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                      <p className="text-xs text-primary font-medium uppercase">PRODUCTOS CAMACHO</p>
                      <h3 className="font-semibold text-white mt-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">(24)</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-white">${product.retail_price?.toFixed(2)}</span>
                        <button className="w-10 h-10 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-colors">
                          <ShoppingCart className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-16">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-gray-400">Intenta con otros filtros o términos de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Productos;
