import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  byLocation: Record<string, number>;
  byService: Record<string, number>;
  byDate: { date: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

// Fetch analytics data
export const useAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AppointmentStats> => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;

      const stats: AppointmentStats = {
        total: appointments?.length || 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        byLocation: {},
        byService: {},
        byDate: [],
        byStatus: [],
      };

      const dateMap: Record<string, number> = {};

      appointments?.forEach(apt => {
        // Count by status
        if (apt.status === 'pending') stats.pending++;
        else if (apt.status === 'confirmed') stats.confirmed++;
        else if (apt.status === 'completed') stats.completed++;
        else if (apt.status === 'cancelled') stats.cancelled++;

        // Count by location
        if (!stats.byLocation[apt.location_name]) {
          stats.byLocation[apt.location_name] = 0;
        }
        stats.byLocation[apt.location_name]++;

        // Count by service
        if (!stats.byService[apt.service_name]) {
          stats.byService[apt.service_name] = 0;
        }
        stats.byService[apt.service_name]++;

        // Count by date (last 30 days)
        const dateKey = apt.appointment_date;
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = 0;
        }
        dateMap[dateKey]++;
      });

      // Convert date map to array
      stats.byDate = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .slice(-30);

      // Status distribution
      stats.byStatus = [
        { status: 'Pendientes', count: stats.pending },
        { status: 'Confirmadas', count: stats.confirmed },
        { status: 'Completadas', count: stats.completed },
        { status: 'Canceladas', count: stats.cancelled },
      ];

      return stats;
    },
    enabled,
  });
};

// Fetch reviews stats
export const useReviewsStats = (enabled = true) => {
  return useQuery({
    queryKey: ['reviews-stats'],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*');
      
      if (error) throw error;

      const total = reviews?.length || 0;
      const published = reviews?.filter(r => r.is_published).length || 0;
      const avgRating = total > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0;
      
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: reviews?.filter(r => r.rating === rating).length || 0,
      }));

      return {
        total,
        published,
        avgRating,
        ratingDistribution,
      };
    },
    enabled,
  });
};
