"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ShoppingCart, Star, Heart, Eye } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ProductRevealCardProps {
  name?: string
  price?: number
  originalPrice?: number
  image?: string
  description?: string
  rating?: number
  reviewCount?: number
  brand?: string
  sku?: string
  onAdd?: () => void
  onFavorite?: () => void
  onView?: () => void
  enableAnimations?: boolean
  className?: string
  isFeatured?: boolean
}

export function ProductRevealCard({
  name = "Producto Natural",
  price = 99,
  originalPrice,
  image = "/placeholder.svg",
  description = "Producto natural elaborado con ingredientes de la más alta calidad.",
  rating = 4.5,
  reviewCount = 24,
  brand = "Productos Camacho",
  sku,
  onAdd,
  onFavorite,
  onView,
  enableAnimations = true,
  className,
  isFeatured = false,
}: ProductRevealCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    onFavorite?.()
  }

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-shadow hover:shadow-lg",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <motion.img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          variants={{
            rest: { scale: 1 },
            hover: shouldAnimate ? { scale: 1.08, transition: { duration: 0.4 } } : {},
          }}
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {isFeatured && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Destacado
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <motion.button
          onClick={handleFavorite}
          className={cn(
            "absolute right-3 top-3 rounded-full p-2.5 transition-all",
            isFavorite 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-background hover:text-destructive"
          )}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </motion.button>

        {/* Quick View Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1, transition: { duration: 0.3 } },
          }}
        >
          <motion.div
            className="flex gap-3"
            variants={{
              rest: { y: 20, opacity: 0 },
              hover: { y: 0, opacity: 1, transition: { delay: 0.1 } },
            }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-12 w-12"
              onClick={onView}
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90"
              onClick={onAdd}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Brand */}
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          {brand}
        </span>

        {/* Name */}
        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.floor(rating)
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
            onClick={onAdd}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
