import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, Stethoscope, 
  Loader2, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

export const AppointmentModal = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientEmail,
  patientPhone
}: AppointmentModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    }
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, specialty, user_id')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    }
  });

  const selectedLocation = locations.find((l: any) => l.id === locationId);
  const selectedDoctor = doctors.find((d: any) => d.id === doctorId);
  const selectedService = services.find((s: any) => s.id === serviceId);

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!date || !time || !locationId || !serviceId) {
        throw new Error("Completa todos los campos requeridos");
      }

      const { error } = await supabase.from('appointments').insert({
        patient_name: patientName,
        patient_email: patientEmail || '',
        patient_phone: patientPhone || '',
        appointment_date: format(date, 'yyyy-MM-dd'),
        appointment_time: time,
        location_id: locationId,
        location_name: selectedLocation?.name || '',
        service_id: serviceId,
        service_name: selectedService?.name || '',
        doctor_id: doctorId || null,
        notes,
        status: 'pending'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', patientId] });
      toast({ 
        title: "Cita agendada",
        description: `Cita programada para ${format(date!, 'd MMMM yyyy', { locale: es })} a las ${time}`
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo agendar la cita",
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setDate(undefined);
    setTime("");
    setLocationId("");
    setDoctorId("");
    setServiceId("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Agendar Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Programar una cita para <span className="font-medium">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Info Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{patientName}</p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {patientEmail && <span>{patientEmail}</span>}
                  {patientPhone && <span>• {patientPhone}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Sucursal *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {locations.map((location: any) => (
                <Card 
                  key={location.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    locationId === location.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setLocationId(location.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      locationId === location.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{location.name}</p>
                      <p className="text-xs text-muted-foreground">{location.city}</p>
                    </div>
                    {locationId === location.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              Servicio *
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      {service.price && (
                        <Badge variant="secondary" className="ml-2">
                          ${service.price}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Doctor (opcional)
            </Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Asignar doctor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {doctors.map((doctor: any) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.profiles?.full_name || 'Sin nombre'} - {doctor.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                Fecha *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Hora *
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales para la cita..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {date && time && locationId && serviceId && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Resumen de la Cita</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Paciente:</span> {patientName}</p>
                  <p><span className="text-muted-foreground">Servicio:</span> {selectedService?.name}</p>
                  <p><span className="text-muted-foreground">Fecha:</span> {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                  <p><span className="text-muted-foreground">Hora:</span> {time}</p>
                  <p><span className="text-muted-foreground">Sucursal:</span> {selectedLocation?.name}</p>
                  {selectedDoctor && (
                    <p><span className="text-muted-foreground">Doctor:</span> Dr. {selectedDoctor.profiles?.full_name}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => createAppointment.mutate()}
            disabled={!date || !time || !locationId || !serviceId || createAppointment.isPending}
          >
            {createAppointment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agendar Cita
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
