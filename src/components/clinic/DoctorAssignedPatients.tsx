import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Search, Phone, Mail, MapPin, Calendar, ChevronRight, User } from "lucide-react";
import { PageHeader } from "@/components/layout/ContentCard";

interface DoctorAssignedPatientsProps {
  doctorId: string;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorAssignedPatients = ({ doctorId, onSelectPatient }: DoctorAssignedPatientsProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: assignedPatients = [], isLoading } = useQuery({
    queryKey: ['doctor-assigned-patients-list', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_patients')
        .select(`
          id,
          is_primary,
          assigned_at,
          patient_profile_id,
          profiles:patient_profile_id (
            id,
            user_id,
            full_name,
            email,
            phone,
            avatar_url,
            location_id,
            patient_code,
            created_at,
            date_of_birth
          )
        `)
        .eq('doctor_id', doctorId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId,
  });

  // Get appointments count for each patient
  const { data: appointmentCounts = {} } = useQuery({
    queryKey: ['patient-appointment-counts', doctorId],
    queryFn: async () => {
      const patientEmails = assignedPatients
        .map((p: any) => p.profiles?.email)
        .filter(Boolean);
      
      if (patientEmails.length === 0) return {};

      const { data } = await supabase
        .from('appointments')
        .select('patient_email')
        .in('patient_email', patientEmails);

      const counts: Record<string, number> = {};
      data?.forEach(apt => {
        counts[apt.patient_email] = (counts[apt.patient_email] || 0) + 1;
      });
      return counts;
    },
    enabled: assignedPatients.length > 0,
  });

  // Get treatments count for each patient
  const { data: treatmentCounts = {} } = useQuery({
    queryKey: ['patient-treatment-counts', doctorId],
    queryFn: async () => {
      const patientIds = assignedPatients
        .map((p: any) => p.profiles?.user_id)
        .filter(Boolean);
      
      if (patientIds.length === 0) return {};

      const { data } = await supabase
        .from('treatments')
        .select('patient_id')
        .in('patient_id', patientIds);

      const counts: Record<string, number> = {};
      data?.forEach(t => {
        counts[t.patient_id] = (counts[t.patient_id] || 0) + 1;
      });
      return counts;
    },
    enabled: assignedPatients.length > 0,
  });

  const filteredPatients = assignedPatients.filter((patient: any) => {
    const profile = patient.profiles;
    if (!profile) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.phone?.includes(query) ||
      profile.patient_code?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mis Pacientes" 
        subtitle={`${assignedPatients.length} pacientes asignados`} 
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email, teléfono o código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Sin resultados' : 'Sin pacientes asignados'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? 'No se encontraron pacientes con esos criterios' 
                : 'Aún no tienes pacientes asignados a tu cuenta'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4">
            {filteredPatients.map((patient: any) => {
              const profile = patient.profiles;
              if (!profile) return null;

              const appointmentCount = appointmentCounts[profile.email] || 0;
              const treatmentCount = treatmentCounts[profile.user_id] || 0;

              return (
                <Card 
                  key={patient.id} 
                  className="group hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onSelectPatient(profile.user_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{profile.full_name}</h3>
                          {patient.is_primary && (
                            <Badge variant="default" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {profile.patient_code && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {profile.patient_code}
                            </span>
                          )}
                          {profile.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {profile.email}
                            </span>
                          )}
                          {profile.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {profile.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {appointmentCount} citas
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {treatmentCount} tratamientos
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Asignado: {format(new Date(patient.assigned_at), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="group-hover:bg-primary/10">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
