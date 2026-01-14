import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Calendar, MapPin, Phone, Mail, ArrowRight,
  CheckCircle2, Loader2, AlertCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  source: string;
  status: string;
  interest: string | null;
  notes: string | null;
  score: number | null;
  location_id: string | null;
  converted_patient_id: string | null;
  converted_at: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Service {
  id: string;
  name: string;
  code: string;
  category: string;
  base_price: number;
  duration_minutes: number | null;
}

interface LeadToPatientConverterProps {
  lead: Lead;
  onConversionComplete?: () => void;
  onClose?: () => void;
}

export const LeadToPatientConverter = ({ lead, onConversionComplete, onClose }: LeadToPatientConverterProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'review' | 'appointment' | 'success'>('review');
  const [patientData, setPatientData] = useState({
    full_name: lead.name,
    email: lead.email || '',
    phone: lead.phone || lead.whatsapp || '',
    notes: lead.notes || '',
    location_id: lead.location_id || ''
  });
  
  const [appointmentData, setAppointmentData] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '10:00',
    service_id: '',
    notes: ''
  });
  
  const [createAppointment, setCreateAppointment] = useState(true);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as Location[];
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services-for-appointment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('id, name, code, category, base_price, duration_minutes')
        .eq('is_active', true)
        .order('category');
      
      if (error) throw error;
      return data as Service[];
    }
  });

  // Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      // 1. Create patient profile
      const userId = crypto.randomUUID();
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: patientData.full_name,
          email: patientData.email || `${lead.name.replace(/\s/g, '.').toLowerCase()}@pendiente.com`,
          phone: patientData.phone || null,
          location_id: patientData.location_id || null,
          notes: `Convertido desde Lead. Origen: ${lead.source}. ${patientData.notes}`.trim(),
          is_archived: false
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Update lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'ganado',
          converted_patient_id: userId,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // 3. Create appointment if requested
      if (createAppointment && appointmentData.service_id) {
        const selectedService = services.find(s => s.id === appointmentData.service_id);
        const selectedLocation = locations.find(l => l.id === patientData.location_id);
        
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            patient_name: patientData.full_name,
            patient_email: patientData.email || `${lead.name.replace(/\s/g, '.').toLowerCase()}@pendiente.com`,
            patient_phone: patientData.phone || '',
            appointment_date: appointmentData.date,
            appointment_time: appointmentData.time,
            service_id: appointmentData.service_id,
            service_name: selectedService?.name || 'Consulta',
            location_id: patientData.location_id || locations[0]?.id || '',
            location_name: selectedLocation?.name || locations[0]?.name || 'Principal',
            notes: appointmentData.notes || `Primera cita - Convertido desde Lead`,
            status: 'pending'
          });

        if (appointmentError) {
          console.error('Appointment creation error:', appointmentError);
          // Don't throw - patient was created successfully
        }
      }

      setCreatedPatientId(userId);
      return { userId, profile };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setStep('success');
      toast({ 
        title: "¡Conversión exitosa!", 
        description: `${lead.name} ahora es paciente${createAppointment ? ' con cita agendada' : ''}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error en conversión", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleConvert = () => {
    if (!patientData.full_name || !patientData.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }
    convertMutation.mutate();
  };

  const selectedService = services.find(s => s.id === appointmentData.service_id);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="hidden sm:inline">Datos del Paciente</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === 'appointment' ? 'text-primary' : step === 'success' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'appointment' ? 'bg-primary text-primary-foreground' : step === 'success' ? 'bg-green-500 text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="hidden sm:inline">Primera Cita</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === 'success' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-green-500 text-white' : 'bg-muted'}`}>
            {step === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 3}
          </div>
          <span className="hidden sm:inline">Completado</span>
        </div>
      </div>

      {step === 'review' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              Revisa y completa los datos del lead antes de convertirlo en paciente.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Lead</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{lead.source}</Badge>
                {lead.score && <Badge variant="secondary">Score: {lead.score}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <Input
                    id="full_name"
                    value={patientData.full_name}
                    onChange={(e) => setPatientData({ ...patientData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientData.email}
                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Sucursal</Label>
                  <Select 
                    value={patientData.location_id} 
                    onValueChange={(v) => setPatientData({ ...patientData, location_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={patientData.notes}
                  onChange={(e) => setPatientData({ ...patientData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el paciente..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => setStep('appointment')}>
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'appointment' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Agendar Primera Cita</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCreateAppointment(!createAppointment)}
                >
                  {createAppointment ? 'Omitir' : 'Agregar cita'}
                </Button>
              </div>
              <CardDescription>
                Agenda automáticamente la primera cita del nuevo paciente
              </CardDescription>
            </CardHeader>
            {createAppointment && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={appointmentData.date}
                      onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={appointmentData.time}
                      onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Servicio</Label>
                  <Select 
                    value={appointmentData.service_id} 
                    onValueChange={(v) => setAppointmentData({ ...appointmentData, service_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <span className="text-muted-foreground ml-2">
                              ${service.base_price.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedService && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración estimada:</span>
                      <span>{selectedService.duration_minutes || 30} minutos</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-semibold">${selectedService.base_price.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="appt_notes">Notas de la cita</Label>
                  <Textarea
                    id="appt_notes"
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                    placeholder="Indicaciones especiales para la cita..."
                    rows={2}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>Nuevo paciente: <strong>{patientData.full_name}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{patientData.email}</span>
                </div>
                {patientData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{patientData.phone}</span>
                  </div>
                )}
                {createAppointment && appointmentData.service_id && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span>
                        Cita: {format(new Date(appointmentData.date), 'EEEE d MMMM', { locale: es })} a las {appointmentData.time}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep('review')}>
              Atrás
            </Button>
            <Button 
              onClick={handleConvert} 
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Convertir a Paciente
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-4"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold">¡Conversión Exitosa!</h3>
          <p className="text-muted-foreground">
            {patientData.full_name} ahora es paciente de NovellDent
          </p>
          {createAppointment && appointmentData.service_id && (
            <div className="p-4 bg-muted rounded-lg inline-block">
              <p className="text-sm">
                <strong>Primera cita agendada:</strong><br />
                {format(new Date(appointmentData.date), 'EEEE d MMMM yyyy', { locale: es })} a las {appointmentData.time}
              </p>
            </div>
          )}
          <div className="pt-4">
            <Button onClick={() => { onConversionComplete?.(); onClose?.(); }}>
              Cerrar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
