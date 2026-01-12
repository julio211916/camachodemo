import { useState, useMemo, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Clock,
  Users, Phone, Mail, MapPin, Search, Filter, Printer, Send, RefreshCw,
  Check, X, AlertCircle, User, MessageSquare, CheckCircle, XCircle,
  Clock4, CalendarDays, LayoutGrid, List, RotateCcw, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// 22 Estados de citas
const APPOINTMENT_STATUSES = [
  { id: "contactado_whatsapp", label: "Contactado por chat de WhatsApp", color: "bg-green-500", icon: MessageSquare },
  { id: "confirmado_whatsapp", label: "Confirmado por WhatsApp", color: "bg-green-600", icon: CheckCircle },
  { id: "no_confirmado", label: "No confirmado", color: "bg-yellow-500", icon: AlertCircle },
  { id: "agenda_online", label: "Agenda Online", color: "bg-blue-500", icon: CalendarDays },
  { id: "notificado_email", label: "Notificado vía email", color: "bg-indigo-500", icon: Mail },
  { id: "confirmado_telefono", label: "Confirmado por teléfono", color: "bg-teal-500", icon: Phone },
  { id: "confirmado_email", label: "Confirmado por email", color: "bg-purple-500", icon: Mail },
  { id: "en_sala_espera", label: "En sala de espera", color: "bg-amber-500", icon: Clock4 },
  { id: "atendiendose", label: "Atendiéndose", color: "bg-orange-500", icon: User },
  { id: "atendido", label: "Atendido", color: "bg-emerald-600", icon: CheckCircle },
  { id: "no_asistio", label: "No asistió", color: "bg-red-500", icon: XCircle },
  { id: "confirmado_whatsapp_2", label: "Confirmado por WhatsApp", color: "bg-green-700", icon: CheckCircle },
  { id: "cancelado", label: "Cancelado", color: "bg-red-600", icon: X },
  { id: "cancelado_conflicto", label: "Cancelado por sesiones en conflicto", color: "bg-red-700", icon: X },
  { id: "cancelado_email", label: "Cancelado por pcte. vía email", color: "bg-red-400", icon: X },
  { id: "cambio_fecha", label: "Cambio de fecha", color: "bg-blue-400", icon: CalendarIcon },
  { id: "anulado_reprogramacion", label: "Anulado por reprogramación", color: "bg-gray-500", icon: RotateCcw },
  { id: "paciente_deshabilitado", label: "Paciente Deshabilitado", color: "bg-gray-700", icon: X },
  { id: "anulado_whatsapp", label: "Anulado por pcte. vía WhatsApp", color: "bg-gray-400", icon: X },
  { id: "anulado_validacion", label: "Anulado vía validación", color: "bg-gray-600", icon: X },
  { id: "cambio_cita", label: "Cambio de cita", color: "bg-blue-300", icon: CalendarIcon },
  { id: "anulado_whatsapp_2", label: "Anulado por WhatsApp", color: "bg-gray-500", icon: X },
];

// Map DB status to our extended status
const mapDbStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'no_confirmado';
    case 'confirmed': return 'confirmado_whatsapp';
    case 'completed': return 'atendido';
    case 'cancelled': return 'cancelado';
    default: return 'no_confirmado';
  }
};

type ViewMode = 'diaria' | 'semanal' | 'global' | 'reprogramacion';

export const AgendaModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('diaria');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(APPOINTMENT_STATUSES.map(s => s.id)));
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 40 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['agenda-appointments'] });
      setLastRefresh(new Date());
    }, 40000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['agenda-appointments', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      let query = supabase.from('appointments').select('*');
      
      if (viewMode === 'diaria' || viewMode === 'global') {
        query = query.eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'));
      } else if (viewMode === 'semanal') {
        const weekStart = startOfWeek(selectedDate, { locale: es });
        const weekEnd = endOfWeek(selectedDate, { locale: es });
        query = query.gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
                     .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'));
      }
      
      const { data, error } = await query.order('appointment_time');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch doctors for filter
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, user_id, specialty').eq('is_active', true);
      // Get profile names
      const enriched = await Promise.all((data || []).map(async (doc) => {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', doc.user_id).single();
        return { ...doc, name: profile?.full_name || 'Doctor' };
      }));
      return enriched;
    }
  });

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = !searchQuery || 
        apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patient_email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProfessional = selectedProfessional === 'all' || apt.doctor_id === selectedProfessional;
      
      const aptStatus = mapDbStatus(apt.status);
      const matchesStatus = selectedStatuses.has(aptStatus);
      
      return matchesSearch && matchesProfessional && matchesStatus;
    });
  }, [appointments, searchQuery, selectedProfessional, selectedStatuses]);

  // Group by time for global view
  const appointmentsByTime = useMemo(() => {
    const grouped: Record<string, typeof appointments> = {};
    filteredAppointments.forEach(apt => {
      if (!grouped[apt.appointment_time]) grouped[apt.appointment_time] = [];
      grouped[apt.appointment_time].push(apt);
    });
    return grouped;
  }, [filteredAppointments]);

  // Toggle status filter
  const toggleStatus = (statusId: string) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(statusId)) {
      newSet.delete(statusId);
    } else {
      newSet.add(statusId);
    }
    setSelectedStatuses(newSet);
  };

  const toggleAllStatuses = () => {
    if (selectedStatuses.size === APPOINTMENT_STATUSES.length) {
      setSelectedStatuses(new Set());
    } else {
      setSelectedStatuses(new Set(APPOINTMENT_STATUSES.map(s => s.id)));
    }
  };

  // Get status badge
  const getStatusBadge = (dbStatus: string) => {
    const mappedStatus = mapDbStatus(dbStatus);
    const status = APPOINTMENT_STATUSES.find(s => s.id === mappedStatus);
    if (!status) return <Badge variant="outline">Desconocido</Badge>;
    
    return (
      <Badge className={`${status.color} text-white gap-1`}>
        <status.icon className="w-3 h-3" />
        {status.label}
      </Badge>
    );
  };

  // Week days for weekly view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: es });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Time slots for global view
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  return (
    <div className="flex h-full gap-0">
      {/* Left Panel - Filters */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Filtros</h2>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={es}
                className="rounded-lg border"
              />
            </div>

            {/* Professional Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profesional</label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los profesionales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los profesionales</SelectItem>
                  {doctors.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Estados de cita</label>
                <Button variant="ghost" size="sm" onClick={toggleAllStatuses} className="h-6 text-xs">
                  {selectedStatuses.size === APPOINTMENT_STATUSES.length ? 'Desmarcar' : 'Marcar'} todos
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {APPOINTMENT_STATUSES.map(status => (
                  <label 
                    key={status.id} 
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox 
                      checked={selectedStatuses.has(status.id)}
                      onCheckedChange={() => toggleStatus(status.id)}
                    />
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span className="truncate">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '40s' }} />
              <span>Recarga cada 40s</span>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center gap-4 flex-wrap">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="diaria" className="gap-1">
                <List className="w-4 h-4" />
                Diaria
              </TabsTrigger>
              <TabsTrigger value="semanal" className="gap-1">
                <CalendarDays className="w-4 h-4" />
                Semanal
              </TabsTrigger>
              <TabsTrigger value="global" className="gap-1">
                <LayoutGrid className="w-4 h-4" />
                Global
              </TabsTrigger>
              <TabsTrigger value="reprogramacion" className="gap-1">
                <RotateCcw className="w-4 h-4" />
                Reprogramación
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-9"
            />
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <Button variant="outline" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Send className="w-4 h-4" />
          </Button>

          {/* Count */}
          <Badge variant="secondary" className="text-sm">
            {filteredAppointments.length} Citas
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : viewMode === 'diaria' || viewMode === 'reprogramacion' ? (
            /* Daily/Reprogramming View - Table */
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Contacto</TableHead>
                    {viewMode === 'reprogramacion' && <TableHead>Motivo</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === 'reprogramacion' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                        No hay citas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <TableRow key={apt.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">{apt.appointment_time}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {apt.patient_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{apt.patient_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {doctors.find(d => d.id === apt.doctor_id)?.name || 'Sin asignar'}
                        </TableCell>
                        <TableCell>{apt.service_name}</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {apt.patient_phone}
                          </div>
                        </TableCell>
                        {viewMode === 'reprogramacion' && (
                          <TableCell className="text-sm text-muted-foreground">
                            {apt.notes || '-'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          ) : viewMode === 'semanal' ? (
            /* Weekly View - Grid */
            <div className="grid grid-cols-7 gap-2 h-full">
              {weekDays.map((day) => {
                const dayAppointments = filteredAppointments.filter(apt => 
                  isSameDay(parseISO(apt.appointment_date), day)
                );
                
                return (
                  <Card 
                    key={day.toISOString()} 
                    className={`flex flex-col ${isToday(day) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <CardHeader className="p-2 pb-1">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(day, 'EEE', { locale: es })}
                        </p>
                        <p className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 overflow-auto">
                      <div className="space-y-1">
                        {dayAppointments.map((apt) => (
                          <div 
                            key={apt.id}
                            className="p-1.5 rounded text-xs bg-primary/10 border-l-2 border-primary cursor-pointer hover:bg-primary/20"
                          >
                            <p className="font-medium truncate">{apt.appointment_time}</p>
                            <p className="truncate text-muted-foreground">{apt.patient_name}</p>
                          </div>
                        ))}
                        {dayAppointments.length === 0 && (
                          <p className="text-xs text-center text-muted-foreground py-4">Sin citas</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Global View - Time Grid */
            <Card>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 sticky left-0 bg-background">Hora</TableHead>
                      {doctors.slice(0, 5).map(doc => (
                        <TableHead key={doc.id} className="min-w-48">{doc.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSlots.map((time) => (
                      <TableRow key={time}>
                        <TableCell className="font-mono text-sm sticky left-0 bg-background">{time}</TableCell>
                        {doctors.slice(0, 5).map(doc => {
                          const apt = filteredAppointments.find(a => 
                            a.appointment_time === time && a.doctor_id === doc.id
                          );
                          
                          return (
                            <TableCell key={doc.id} className="p-1">
                              {apt && (
                                <div className="p-2 rounded bg-primary/10 border-l-2 border-primary text-xs">
                                  <p className="font-medium truncate">{apt.patient_name}</p>
                                  <p className="text-muted-foreground truncate">{apt.service_name}</p>
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendaModule;
