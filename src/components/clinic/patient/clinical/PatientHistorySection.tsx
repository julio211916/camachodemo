import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  History, Calendar, Clock, User, Search, Filter,
  CheckCircle, XCircle, AlertCircle, FileText, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientHistorySectionProps {
  patientId: string;
}

type EventType = 'all' | 'appointment' | 'treatment' | 'evolution' | 'prescription';

export const PatientHistorySection = ({ patientId }: PatientHistorySectionProps) => {
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<EventType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-history-appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .or(`patient_email.eq.${patientId}`)
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-history-treatments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch evolutions
  const { data: evolutions = [] } = useQuery({
    queryKey: ['patient-history-evolutions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Combine and sort events
  const allEvents = [
    ...appointments.map((a: any) => ({
      type: 'appointment' as const,
      date: new Date(a.appointment_date),
      title: `Cita: ${a.service_name}`,
      subtitle: `${a.appointment_time} - ${a.location_name}`,
      status: a.status,
      cancelled: a.status === 'cancelled',
      data: a
    })),
    ...treatments.map((t: any) => ({
      type: 'treatment' as const,
      date: new Date(t.created_at),
      title: `Tratamiento: ${t.name || t.treatment_type}`,
      subtitle: t.description || 'Sin descripción',
      status: t.status,
      cancelled: t.status === 'cancelled',
      data: t
    })),
    ...evolutions.map((e: any) => ({
      type: 'evolution' as const,
      date: new Date(e.created_at),
      title: `Evolución: ${e.evolution_type || 'General'}`,
      subtitle: e.content?.substring(0, 100) || '',
      status: e.is_cancelled ? 'cancelled' : 'active',
      cancelled: e.is_cancelled,
      data: e
    }))
  ].filter(event => {
    if (!showCancelled && event.cancelled) return false;
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'treatment': return Stethoscope;
      case 'evolution': return FileText;
      default: return History;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/10 text-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Confirmado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial del Paciente
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                <SelectItem value="1">Enero</SelectItem>
                <SelectItem value="2">Febrero</SelectItem>
                <SelectItem value="3">Marzo</SelectItem>
                <SelectItem value="4">Abril</SelectItem>
                <SelectItem value="5">Mayo</SelectItem>
                <SelectItem value="6">Junio</SelectItem>
                <SelectItem value="7">Julio</SelectItem>
                <SelectItem value="8">Agosto</SelectItem>
                <SelectItem value="9">Septiembre</SelectItem>
                <SelectItem value="10">Octubre</SelectItem>
                <SelectItem value="11">Noviembre</SelectItem>
                <SelectItem value="12">Diciembre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v: EventType) => setTypeFilter(v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="appointment">Citas</SelectItem>
                <SelectItem value="treatment">Tratamientos</SelectItem>
                <SelectItem value="evolution">Evoluciones</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-40"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="show-cancelled"
                checked={showCancelled}
                onCheckedChange={setShowCancelled}
              />
              <Label htmlFor="show-cancelled" className="text-sm">Mostrar anuladas</Label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {allEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron eventos en el historial</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              {allEvents.map((event, index) => {
                const Icon = getEventIcon(event.type);
                return (
                  <div key={index} className="relative pl-14 pb-6">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-4 w-5 h-5 rounded-full flex items-center justify-center",
                      event.cancelled ? "bg-destructive/20" : "bg-primary/20"
                    )}>
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        event.cancelled ? "bg-destructive" : "bg-primary"
                      )} />
                    </div>

                    <Card className={cn(
                      "transition-colors hover:bg-muted/50",
                      event.cancelled && "opacity-60"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(event.date, "d 'de' MMMM, yyyy", { locale: es })}
                                <Clock className="w-3 h-3 ml-2" />
                                {format(event.date, "HH:mm")}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
