import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface Appointment {
  id: string;
  location_id: string;
  location_name: string;
  service_id: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  reminder_sent: string | null;
  confirmation_token: string | null;
  review_token: string | null;
  review_sent_at: string | null;
}

export interface CreateAppointmentData {
  location_id: string;
  location_name: string;
  service_id: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  referral_code?: string;
}

// Fetch booked time slots for a specific location and date
export const useBookedSlots = (locationId: string, date: Date | undefined) => {
  return useQuery({
    queryKey: ['booked-slots', locationId, date?.toISOString()],
    queryFn: async () => {
      if (!date || !locationId) return [];
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('location_id', locationId)
        .eq('appointment_date', formattedDate)
        .neq('status', 'cancelled');
      
      if (error) throw error;
      return data?.map(a => a.appointment_time) || [];
    },
    enabled: !!locationId && !!date,
  });
};

// Create new appointment
export const useCreateAppointment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return appointment;
    },
    onSuccess: async (appointment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Send confirmation email with appointment ID for confirmation links
      try {
        const formattedDate = format(new Date(variables.appointment_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
        
        await supabase.functions.invoke('send-appointment-confirmation', {
          body: {
            patientName: variables.patient_name,
            patientEmail: variables.patient_email,
            locationName: variables.location_name,
            serviceName: variables.service_name,
            appointmentDate: formattedDate,
            appointmentTime: variables.appointment_time,
            appointmentId: appointment.id,
          },
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the appointment creation if email fails
      }
    },
    onError: (error) => {
      toast({
        title: "Error al agendar cita",
        description: "Por favor intenta de nuevo más tarde.",
        variant: "destructive",
      });
      console.error('Error creating appointment:', error);
    },
  });
};

// Fetch all appointments (for admin)
export const useAppointments = (enabled = true) => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled,
  });
};

// Update appointment status
export const useUpdateAppointmentStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Appointment['status'] }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      
      // If appointment is completed and has a referral code, notify the referrer
      if (appointment.status === 'completed' && appointment.referral_code) {
        try {
          await supabase.functions.invoke('notify-referral-complete', {
            body: {
              appointmentId: appointment.id,
              referralCode: appointment.referral_code,
            },
          });
        } catch (error) {
          console.error('Error notifying referral completion:', error);
        }
      }
      
      toast({
        title: "Estado actualizado",
        description: "El estado de la cita ha sido actualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
      console.error('Error updating appointment:', error);
    },
  });
};

// Delete appointment
export const useDeleteAppointment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita.",
        variant: "destructive",
      });
      console.error('Error deleting appointment:', error);
    },
  });
};
