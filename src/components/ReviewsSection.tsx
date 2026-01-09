import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { usePublishedReviews } from "@/hooks/useReviews";
import { StarRating } from "./StarRating";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const ReviewsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { data: reviews = [], isLoading } = usePublishedReviews();

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading || reviews.length === 0) {
    return null;
  }

  return (
    <section id="resenas" className="section-padding bg-gradient-to-b from-secondary/20 to-background" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Opiniones de Pacientes
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Lo que dicen <span className="gradient-text">nuestros pacientes</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <StarRating rating={Math.round(avgRating)} readonly size="lg" />
            <span className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length} reseñas)</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {review.patient_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{review.patient_name}</h4>
                  <p className="text-sm text-muted-foreground">{review.service_name}</p>
                </div>
              </div>

              <StarRating rating={review.rating} readonly size="sm" />

              {review.comment && (
                <p className="mt-4 text-muted-foreground line-clamp-4">
                  "{review.comment}"
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>{review.location_name}</span>
                <span>{format(parseISO(review.created_at), "d MMM yyyy", { locale: es })}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
