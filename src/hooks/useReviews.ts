import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  appointment_id: string | null;
  patient_name: string;
  patient_email: string;
  location_id: string;
  location_name: string;
  service_id: string;
  service_name: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
}

export interface CreateReviewData {
  appointment_id?: string;
  patient_name: string;
  patient_email: string;
  location_id: string;
  location_name: string;
  service_id: string;
  service_name: string;
  rating: number;
  comment?: string;
  review_token?: string;
}

// Fetch published reviews (public)
export const usePublishedReviews = () => {
  return useQuery({
    queryKey: ['reviews', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Review[];
    },
  });
};

// Fetch all reviews (admin)
export const useAllReviews = (enabled = true) => {
  return useQuery({
    queryKey: ['reviews', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled,
  });
};

// Create a review
export const useCreateReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "¡Gracias por tu reseña!",
        description: "Tu opinión nos ayuda a mejorar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo enviar tu reseña. Intenta de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating review:', error);
    },
  });
};

// Toggle review publish status (admin)
export const useToggleReviewPublish = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ is_published })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: variables.is_published ? "Reseña publicada" : "Reseña ocultada",
        description: variables.is_published 
          ? "La reseña ahora es visible para todos."
          : "La reseña ya no es visible públicamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la reseña.",
        variant: "destructive",
      });
      console.error('Error toggling review:', error);
    },
  });
};

// Delete review (admin)
export const useDeleteReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Reseña eliminada",
        description: "La reseña ha sido eliminada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña.",
        variant: "destructive",
      });
      console.error('Error deleting review:', error);
    },
  });
};
