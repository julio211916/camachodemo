import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface AppointmentPayload {
  id: string;
  patient_name: string;
  patient_email: string;
  appointment_date: string;
  appointment_time: string;
  location_name: string;
  service_name: string;
  status: string;
}

export const useRealtimeAppointments = (enabled = true) => {
  const queryClient = useQueryClient();

  const handleAppointmentChange = useCallback(
    (payload: RealtimePostgresChangesPayload<AppointmentPayload>) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });

      const appointment = payload.new as AppointmentPayload;

      if (payload.eventType === "INSERT" && appointment) {
        const formattedDate = format(
          new Date(appointment.appointment_date),
          "d 'de' MMMM",
          { locale: es }
        );

        toast.success("Nueva cita agendada", {
          description: `${appointment.patient_name} - ${formattedDate} a las ${appointment.appointment_time}`,
          duration: 5000,
          action: {
            label: "Ver",
            onClick: () => {
              window.location.href = "/admin";
            },
          },
        });

        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {
          // Ignore audio errors
        }
      }

      if (payload.eventType === "UPDATE" && appointment) {
        const oldAppointment = payload.old as AppointmentPayload;
        
        if (oldAppointment?.status !== appointment.status) {
          const statusMessages: Record<string, string> = {
            confirmed: "confirmada",
            cancelled: "cancelada",
            completed: "completada",
          };

          const statusMessage = statusMessages[appointment.status];
          if (statusMessage) {
            toast.info(`Cita ${statusMessage}`, {
              description: `${appointment.patient_name} - ${appointment.service_name}`,
              duration: 4000,
            });
          }
        }
      }

      if (payload.eventType === "DELETE") {
        const oldAppointment = payload.old as AppointmentPayload;
        if (oldAppointment) {
          toast.warning("Cita eliminada", {
            description: oldAppointment.patient_name,
            duration: 3000,
          });
        }
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        handleAppointmentChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscribed to appointments");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, handleAppointmentChange]);
};

// Hook for reviews realtime
export const useRealtimeReviews = (enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["reviews"] });
          queryClient.invalidateQueries({ queryKey: ["published-reviews"] });

          if (payload.eventType === "INSERT") {
            const review = payload.new as { patient_name: string; rating: number };
            toast.success("Nueva reseña recibida", {
              description: `${review.patient_name} - ${review.rating} estrellas`,
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
};
