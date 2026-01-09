import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Star, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";
import { useCreateReview } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-novelldent.png";

export const ReviewPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const createReview = useCreateReview();

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!token) {
        setError("Enlace inválido");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("review_token", token)
        .single();

      if (fetchError || !data) {
        setError("No se encontró la cita asociada a este enlace");
        setLoading(false);
        return;
      }

      // Check if review already exists for this appointment
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("appointment_id", data.id)
        .maybeSingle();

      if (existingReview) {
        setSubmitted(true);
      }

      setAppointment(data);
      setName(data.patient_name);
      setEmail(data.patient_email);
      setLoading(false);
    };

    fetchAppointment();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    try {
      await createReview.mutateAsync({
        appointment_id: appointment?.id,
        patient_name: name,
        patient_email: email,
        location_id: appointment?.location_id || "unknown",
        location_name: appointment?.location_name || "NovellDent",
        service_id: appointment?.service_id || "unknown",
        service_name: appointment?.service_name || "Consulta",
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img src={logo} alt="NovellDent" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {error ? "Error" : submitted ? "¡Gracias!" : "Cuéntanos tu experiencia"}
          </h1>
        </motion.div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 border border-border/50 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-muted-foreground">{error}</p>
          </motion.div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 border border-border/50 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">¡Gracias por tu opinión!</h2>
            <p className="text-muted-foreground">
              Tu reseña nos ayuda a seguir mejorando nuestros servicios. 🦷
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-xl space-y-6"
          >
            {appointment && (
              <div className="bg-secondary/30 rounded-xl p-4 text-sm">
                <p className="text-muted-foreground mb-1">Tu cita en:</p>
                <p className="font-semibold text-foreground">{appointment.location_name}</p>
                <p className="text-muted-foreground">{appointment.service_name}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">¿Cómo calificarías tu experiencia?</p>
              <div className="flex justify-center">
                <StarRating rating={rating} onRatingChange={setRating} size="lg" />
              </div>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-primary mt-2"
                >
                  {rating === 5 ? "¡Excelente!" : 
                   rating === 4 ? "¡Muy bien!" :
                   rating === 3 ? "Bien" :
                   rating === 2 ? "Regular" : "Necesitamos mejorar"}
                </motion.p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tu nombre
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Comentario (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia..."
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={rating === 0 || createReview.isPending}
              className="w-full btn-primary rounded-full"
            >
              {createReview.isPending ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Reseña
                </>
              )}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
