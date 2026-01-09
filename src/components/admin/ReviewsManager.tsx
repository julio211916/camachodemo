import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StarRating } from "@/components/StarRating";
import { useAllReviews, useToggleReviewPublish, useDeleteReview } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

export const ReviewsManager = () => {
  const { data: reviews = [], isLoading } = useAllReviews();
  const togglePublish = useToggleReviewPublish();
  const deleteReview = useDeleteReview();

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    const matchesPublished =
      publishedFilter === "all" ||
      (publishedFilter === "published" && review.is_published) ||
      (publishedFilter === "unpublished" && !review.is_published);

    return matchesSearch && matchesRating && matchesPublished;
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary" />
          Reseñas de Pacientes
        </h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(avgRating)} readonly size="sm" />
          <span className="font-semibold">{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({reviews.length})</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o comentario..."
              className="pl-12 h-12 rounded-xl"
            />
          </div>
          <div className="flex gap-4">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[150px] h-12 rounded-xl">
                <Star className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4 estrellas</SelectItem>
                <SelectItem value="3">3 estrellas</SelectItem>
                <SelectItem value="2">2 estrellas</SelectItem>
                <SelectItem value="1">1 estrella</SelectItem>
              </SelectContent>
            </Select>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-[160px] h-12 rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="published">Publicadas</SelectItem>
                <SelectItem value="unpublished">Sin publicar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay reseñas</h3>
          <p className="text-muted-foreground">
            {searchTerm || ratingFilter !== "all" || publishedFilter !== "all"
              ? "No se encontraron reseñas con los filtros seleccionados."
              : "Aún no hay reseñas de pacientes."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-card rounded-2xl border p-6 transition-all",
                review.is_published
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border/50"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {review.patient_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {review.patient_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {review.patient_email}
                      </p>
                    </div>
                    <Badge
                      variant={review.is_published ? "default" : "secondary"}
                      className="ml-auto"
                    >
                      {review.is_published ? "Publicada" : "Sin publicar"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {review.service_name} • {review.location_name}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-muted-foreground bg-secondary/30 rounded-xl p-4">
                      "{review.comment}"
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    {format(parseISO(review.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      togglePublish.mutate({
                        id: review.id,
                        is_published: !review.is_published,
                      })
                    }
                    className="rounded-full"
                  >
                    {review.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Publicar
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La reseña de{" "}
                          <strong>{review.patient_name}</strong> será eliminada
                          permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReview.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
