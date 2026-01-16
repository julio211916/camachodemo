import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RefreshCcw,
  ChevronRight,
  Share2
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  retail_price: number;
  cost_price: number;
  wholesale_price: number;
  images: string[];
  category_id: string;
  unit: string;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ProductoDetalle = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        console.error("Product not found:", error);
        setLoading(false);
        return;
      }

      setProduct(data);

      // Fetch category
      if (data.category_id) {
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", data.category_id)
          .single();
        
        if (catData) {
          setCategory(catData);
          
          // Fetch related products
          const { data: related } = await supabase
            .from("products")
            .select("*")
            .eq("category_id", data.category_id)
            .neq("id", data.id)
            .limit(4);
          
          if (related) setRelatedProducts(related);
        }
      }

      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product.id);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.short_description || product?.name,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f1a] text-white">
        <NewHeader />
        <div className="container mx-auto px-4 py-28">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-white/5 rounded w-1/2 animate-pulse" />
              <div className="h-20 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#1a1f1a] text-white">
        <NewHeader />
        <div className="container mx-auto px-4 py-28 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button asChild>
            <Link to="/productos">Ver Productos</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-white">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-white">Inicio</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/productos" className="hover:text-white">Productos</Link>
          {category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/productos?categoria=${category.slug}`} className="hover:text-white">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-square bg-white/5 rounded-2xl p-8 flex items-center justify-center border border-white/10">
              {product.images && product.images[selectedImage] ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <ShoppingCart className="w-24 h-24 text-gray-500" />
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg border-2 transition-colors overflow-hidden ${
                      selectedImage === i ? "border-primary" : "border-white/10"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <p className="text-primary font-medium uppercase text-sm">PRODUCTOS CAMACHO</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">{product.name}</h1>
              <p className="text-gray-400 text-sm mt-1">SKU: {product.sku}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-gray-400">(24 reseñas)</span>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">${product.retail_price?.toFixed(2)}</span>
                {product.unit && <span className="text-gray-400">/ {product.unit}</span>}
              </div>
              {product.wholesale_price && (
                <p className="text-sm text-gray-400">
                  Precio mayoreo: <span className="text-white">${product.wholesale_price.toFixed(2)}</span>
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-300 leading-relaxed">{product.description}</p>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <Button onClick={handleAddToCart} className="flex-1 h-12">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Agregar al Carrito
              </Button>
              
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                  isFavorite 
                    ? "bg-red-500 border-red-500 text-white" 
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-gray-400">Envío gratis en compras +$500</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-gray-400">Garantía de calidad</p>
              </div>
              <div className="text-center">
                <RefreshCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-gray-400">Devoluciones fáciles</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/producto/${prod.slug}`}
                  className="group bg-white/5 rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-square bg-white/5 rounded-lg mb-3 flex items-center justify-center">
                    {prod.images?.[0] ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <ShoppingCart className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <h3 className="font-medium line-clamp-2 text-sm">{prod.name}</h3>
                  <p className="text-primary font-bold mt-1">${prod.retail_price?.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductoDetalle;
