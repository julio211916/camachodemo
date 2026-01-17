import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  retail_price: number;
  wholesale_price: number | null;
  images: string[] | null;
  sku: string | null;
  current_stock: number | null;
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, retail_price, wholesale_price, images, sku, current_stock")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      const { data } = await supabase
        .from("products")
        .select("id, name, description, retail_price, wholesale_price, images, sku, current_stock")
        .eq("is_active", true)
        .limit(8);
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.retail_price,
      image: product.images?.[0] || undefined,
      sku: product.sku || undefined,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium uppercase tracking-widest text-sm">Lo más vendido</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mt-2 mb-4">Productos Destacados</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/producto/${product.id}`)}
              className="group cursor-pointer"
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-all">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <motion.button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="absolute bottom-3 left-3 right-3 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Agregar
                  </motion.button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{product.name}</h3>
                  <span className="text-lg font-bold text-primary">{formatPrice(product.retail_price)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate("/productos")}
            className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg"
          >
            Ver Todos los Productos
          </motion.button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
