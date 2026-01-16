import { Star, Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    retail_price: number;
    images: string[];
    is_featured?: boolean;
  };
  viewMode?: "grid" | "list";
  index?: number;
}

export const ProductCard = ({ product, viewMode = "grid", index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300 ${
        viewMode === "list" ? "flex gap-4" : ""
      }`}
    >
      <Link to={`/producto/${product.slug}`} className={viewMode === "list" ? "contents" : "block"}>
        <div className={`${viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-square"} relative mb-4 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden`}>
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
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
          
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
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
            <button 
              onClick={handleAddToCart}
              className="w-10 h-10 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
