import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewHeader } from '@/components/NewHeader';
import { Footer } from '@/components/Footer';
import { ProductRevealCard } from '@/components/ui/product-reveal-card';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Productos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true);

      if (selectedCategory && selectedCategory !== 'all') {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query.order('is_featured', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: categories.length > 0 || selectedCategory === 'all',
  });

  // Get unique brands from products
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((p) => {
      if (p.sku?.startsWith('JAR')) brandSet.add('AJOLOTIUS');
      else if (p.sku?.startsWith('BAL')) brandSet.add('BRONCOPLUS');
      else brandSet.add('Productos Camacho');
    });
    return Array.from(brandSet);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Price filter
    filtered = filtered.filter(
      (p) => (p.retail_price || 0) >= priceRange[0] && (p.retail_price || 0) <= priceRange[1]
    );

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => {
        const brand = p.sku?.startsWith('JAR') ? 'AJOLOTIUS' 
          : p.sku?.startsWith('BAL') ? 'BRONCOPLUS' 
          : 'Productos Camacho';
        return selectedBrands.includes(brand);
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => (a.retail_price || 0) - (b.retail_price || 0));
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => (b.retail_price || 0) - (a.retail_price || 0));
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        filtered = [...filtered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return filtered;
  }, [products, search, priceRange, selectedBrands, sortBy]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', slug);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.retail_price || 0,
      image: product.images?.[0] || '/placeholder.svg',
      sku: product.sku,
    });
  };

  const currentCategory = categories.find(c => c.slug === selectedCategory);
  const pageTitle = currentCategory?.name || 'Todos los Productos';

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categorías</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Todos los Productos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                selectedCategory === category.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-sm opacity-70">
                ({products.filter(p => p.category_id === category.id).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Rango de Precio</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={500}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
        <div className="space-y-2 mt-3">
          {[
            { label: '$0 - $50', range: [0, 50] },
            { label: '$50 - $100', range: [50, 100] },
            { label: '$100 - $150', range: [100, 150] },
            { label: '$150+', range: [150, 500] },
          ].map((option) => (
            <label key={option.label} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={priceRange[0] === option.range[0] && priceRange[1] === option.range[1]}
                onCheckedChange={() => setPriceRange(option.range as [number, number])}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">Marcas</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSearch('');
          setSelectedCategory('all');
          setPriceRange([0, 500]);
          setSelectedBrands([]);
          setSortBy('featured');
        }}
      >
        Limpiar Filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      
      {/* Hero Section */}
      <section className="bg-primary/5 py-16 mt-16">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{pageTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre nuestra amplia gama de productos naturales elaborados con
              fórmulas tradicionales mexicanas.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Mobile Filters */}
                  <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filtros
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Filtros</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Destacados</SelectItem>
                      <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                      <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredProducts.length} productos
                  </span>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedBrands.length > 0 || search) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      Búsqueda: {search}
                      <button onClick={() => setSearch('')}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedBrands.map((brand) => (
                    <span
                      key={brand}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {brand}
                      <button
                        onClick={() => setSelectedBrands(selectedBrands.filter((b) => b !== brand))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[3/4]" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground">No se encontraron productos</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('all');
                      setPriceRange([0, 500]);
                      setSelectedBrands([]);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <motion.div
                  layout
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'flex flex-col gap-4'
                  }
                >
                  <AnimatePresence>
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <ProductRevealCard
                          name={product.name}
                          price={product.retail_price || 0}
                          originalPrice={product.cost_price && product.cost_price < (product.retail_price || 0) ? undefined : undefined}
                          image={product.images?.[0] || '/placeholder.svg'}
                          description={product.description || ''}
                          brand={product.sku?.startsWith('JAR') ? 'AJOLOTIUS' : product.sku?.startsWith('BAL') ? 'BRONCOPLUS' : 'Productos Camacho'}
                          sku={product.sku}
                          isFeatured={product.is_featured}
                          onAdd={() => handleAddToCart(product)}
                          onView={() => navigate(`/productos/${product.slug}`)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
