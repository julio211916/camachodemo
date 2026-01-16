import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewHeader } from '@/components/NewHeader';
import { Footer } from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Heart, Share2, Minus, Plus, Star, Truck, Shield, RotateCcw, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductRevealCard } from '@/components/ui/product-reveal-card';

export default function ProductoDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.retail_price || 0,
        image: product.images?.[0] || '/placeholder.svg',
        sku: product.sku,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NewHeader />
        <div className="container-wide py-24">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-12 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <NewHeader />
        <div className="container-wide py-24 text-center">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <Button onClick={() => navigate('/productos')} className="mt-4">
            Ver todos los productos
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const brand = product.sku?.startsWith('JAR') ? 'AJOLOTIUS' 
    : product.sku?.startsWith('BAL') ? 'BRONCOPLUS' 
    : 'Productos Camacho';

  return (
    <div className="min-h-screen bg-background">
      <NewHeader />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="container-wide py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        </div>

        {/* Product Section */}
        <section className="container-wide pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square bg-muted rounded-2xl overflow-hidden"
            >
              <img
                src={product.images?.[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                  Destacado
                </Badge>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-primary">
                  {brand}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                  {product.name}
                </h1>
                <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-muted-foreground">(24 reseñas)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-foreground">
                  ${product.retail_price?.toFixed(2) || '0.00'}
                </span>
                {product.wholesale_price && (
                  <span className="text-lg text-muted-foreground">
                    Mayoreo: ${product.wholesale_price?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {product.description || product.short_description || 
                  'Producto natural elaborado con los más altos estándares de calidad, siguiendo las fórmulas tradicionales de la botica mexicana.'}
              </p>

              {/* Quantity & Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="px-6 font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-1 rounded-xl"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Agregar al Carrito
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-12 w-12"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={isFavorite ? 'fill-destructive text-destructive' : ''} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-12 w-12"
                >
                  <Share2 />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Envío Gratis</span>
                  <span className="text-xs text-muted-foreground">En compras +$500</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Garantía</span>
                  <span className="text-xs text-muted-foreground">Calidad asegurada</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <RotateCcw className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Devoluciones</span>
                  <span className="text-xs text-muted-foreground">30 días</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="border-t bg-muted/30">
          <div className="container-wide py-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="description">Descripción</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
                <TabsTrigger value="usage">Modo de Uso</TabsTrigger>
                <TabsTrigger value="reviews">Reseñas</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  {product.description || 
                    'Producto natural elaborado con los más altos estándares de calidad, siguiendo las fórmulas tradicionales de la botica mexicana. Nuestros productos están formulados con ingredientes naturales seleccionados cuidadosamente para garantizar su efectividad.'}
                </p>
              </TabsContent>
              <TabsContent value="ingredients">
                <p className="text-muted-foreground">
                  Ingredientes naturales de origen vegetal. Consulte el empaque para información detallada.
                </p>
              </TabsContent>
              <TabsContent value="usage">
                <p className="text-muted-foreground">
                  Siga las instrucciones del empaque. En caso de duda, consulte a un profesional de la salud.
                </p>
              </TabsContent>
              <TabsContent value="reviews">
                <p className="text-muted-foreground">
                  Las reseñas de clientes aparecerán aquí.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="container-wide py-16">
            <h2 className="text-2xl font-bold mb-8">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductRevealCard
                  key={p.id}
                  name={p.name}
                  price={p.retail_price || 0}
                  image={p.images?.[0] || '/placeholder.svg'}
                  brand={p.sku?.startsWith('JAR') ? 'AJOLOTIUS' : p.sku?.startsWith('BAL') ? 'BRONCOPLUS' : 'Productos Camacho'}
                  onAdd={() => addItem({
                    id: p.id,
                    name: p.name,
                    price: p.retail_price || 0,
                    image: p.images?.[0] || '/placeholder.svg',
                    sku: p.sku,
                  })}
                  onView={() => navigate(`/productos/${p.slug}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
