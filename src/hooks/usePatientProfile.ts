import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  avatarUrl: string | null;
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  tags: string[];
  notes: string | null;
  createdAt: string;
  lastVisit?: string;
}

export interface PatientTreatment {
  id: string;
  name: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string | null;
  cost: number;
  paidAmount: number;
  doctorName: string;
  notes: string | null;
}

export interface PatientAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
  doctor: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
}

export interface PatientInvoice {
  id: string;
  number: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  items: { description: string; amount: number }[];
}

export const usePatientProfile = (patientId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patient profile
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      // Try to find by id first, then by user_id
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error || !profile) {
        // Try by user_id
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', patientId)
          .single();
        
        if (result.error) {
          // Get any patient for demo purposes
          const anyResult = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
            .single();
          
          if (anyResult.error || !anyResult.data) {
            return null;
          }
          profile = anyResult.data;
        } else {
          profile = result.data;
        }
      }

      // Get medical history
      const { data: medicalHistory } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', profile.user_id)
        .single();

      // Get last appointment
      const { data: lastAppt } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('patient_email', profile.email)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false })
        .limit(1);

      const patientProfile: PatientProfile = {
        id: profile.id,
        userId: profile.user_id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        address: profile.address,
        avatarUrl: profile.avatar_url,
        bloodType: medicalHistory?.blood_type || undefined,
        allergies: medicalHistory?.allergies || [],
        conditions: medicalHistory?.conditions || [],
        medications: medicalHistory?.medications || [],
        emergencyContact: medicalHistory?.emergency_contact_name ? {
          name: medicalHistory.emergency_contact_name,
          phone: medicalHistory.emergency_contact_phone || '',
          relationship: undefined
        } : undefined,
        tags: profile.tags || [],
        notes: profile.notes,
        createdAt: profile.created_at,
        lastVisit: lastAppt?.[0]?.appointment_date || undefined
      };

      return patientProfile;
    },
    enabled: !!patientId,
  });

  // Fetch treatments
  const { data: treatments = [], isLoading: loadingTreatments } = useQuery({
    queryKey: ['patient-treatments', patient?.userId],
    queryFn: async () => {
      if (!patient?.userId) return [];

      const { data, error } = await supabase
        .from('treatments')
        .select(`
          *,
          doctors (
            user_id,
            specialty
          )
        `)
        .eq('patient_id', patient.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get paid amounts from invoices
      const treatmentIds = (data || []).map(t => t.id);
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('treatment_id, total')
        .in('treatment_id', treatmentIds);

      const paidByTreatment = (invoiceItems || []).reduce((acc, item) => {
        acc[item.treatment_id] = (acc[item.treatment_id] || 0) + Number(item.total);
        return acc;
      }, {} as Record<string, number>);

      // Get doctor profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.full_name;
        return acc;
      }, {} as Record<string, string>);

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status || 'planned',
        startDate: t.start_date,
        endDate: t.end_date,
        cost: Number(t.cost) || 0,
        paidAmount: paidByTreatment[t.id] || 0,
        doctorName: t.doctor_id && profilesMap[t.doctor_id] 
          ? `Dr. ${profilesMap[t.doctor_id]}`
          : 'Dr. Sin asignar',
        notes: t.notes
      })) as PatientTreatment[];
    },
    enabled: !!patient?.userId,
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['patient-appointments', patient?.email],
    queryFn: async () => {
      if (!patient?.email) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', patient.email)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        date: a.appointment_date,
        time: a.appointment_time,
        service: a.service_name,
        doctor: 'Dr. Asignado', // Could fetch doctor name
        status: a.status,
        notes: a.notes
      })) as PatientAppointment[];
    },
    enabled: !!patient?.email,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['patient-invoices', patient?.userId],
    queryFn: async () => {
      if (!patient?.userId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            description,
            total
          )
        `)
        .eq('patient_id', patient.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((inv: any) => ({
        id: inv.id,
        number: inv.invoice_number,
        date: inv.created_at,
        total: Number(inv.total),
        status: inv.status,
        items: (inv.invoice_items || []).map((item: any) => ({
          description: item.description,
          amount: Number(item.total)
        }))
      })) as PatientInvoice[];
    },
    enabled: !!patient?.userId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalTreatmentCost = treatments.reduce((sum, t) => sum + t.cost, 0);
    const totalPaid = treatments.reduce((sum, t) => sum + t.paidAmount, 0);
    const upcomingAppts = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const completedAppts = appointments.filter(a => a.status === 'completed').length;
    const pendingBalance = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);

    return {
      totalTreatmentCost,
      totalPaid,
      balance: totalTreatmentCost - totalPaid,
      upcomingAppts,
      completedAppts,
      pendingBalance,
      paymentProgress: totalTreatmentCost > 0 ? (totalPaid / totalTreatmentCost) * 100 : 0
    };
  }, [treatments, appointments, invoices]);

  // Update patient mutation
  const updatePatient = useMutation({
    mutationFn: async (updates: Partial<PatientProfile>) => {
      if (!patient?.id) throw new Error("No patient ID");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          phone: updates.phone,
          address: updates.address,
          gender: updates.gender,
          date_of_birth: updates.dateOfBirth,
          tags: updates.tags,
          notes: updates.notes
        })
        .eq('id', patient.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      toast({ title: "Guardado", description: "Perfil actualizado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  });

  return {
    patient,
    treatments,
    appointments,
    invoices,
    stats,
    isLoading: loadingPatient || loadingTreatments || loadingAppointments || loadingInvoices,
    updatePatient
  };
};

export default usePatientProfile;
