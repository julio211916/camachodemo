import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isSameDay, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, MapPin, CheckCircle2, AlertCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  patient_name: string;
  service_name: string;
  location_name: string;
  status: string;
  doctor_id?: string;
}

interface AppointmentCalendarWidgetProps {
  appointments: Appointment[];
  compact?: boolean;
}

export const AppointmentCalendarWidget = ({ appointments, compact = false }: AppointmentCalendarWidgetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return appointments
      .filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate))
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDate]);

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(apt => {
      dates.add(apt.appointment_date);
    });
    return dates;
  }, [appointments]);

  // Count appointments by status for selected date
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    selectedDateAppointments.forEach(apt => {
      if (apt.status in counts) {
        counts[apt.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [selectedDateAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-amber-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Confirmada</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pendiente</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Hoy';
    if (isTomorrow(selectedDate)) return 'Mañana';
    return format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{getDateLabel()}</span>
          <Badge variant="outline">{selectedDateAppointments.length} citas</Badge>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {selectedDateAppointments.slice(0, 4).map(apt => (
              <div 
                key={apt.id} 
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div className={cn("w-1.5 h-8 rounded-full", getStatusColor(apt.status))} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{apt.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                </div>
              </div>
            ))}
            {selectedDateAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin citas para esta fecha
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Calendar */}
      <div className="flex flex-col items-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          locale={es}
          className="rounded-md border"
          modifiers={{
            hasAppointments: (date) => datesWithAppointments.has(format(date, 'yyyy-MM-dd')),
          }}
          modifiersStyles={{
            hasAppointments: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: 'hsl(var(--primary))',
            },
          }}
        />
        
        {/* Status Summary */}
        <div className="flex gap-3 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{statusCounts.confirmed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{statusCounts.pending}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{statusCounts.completed}</span>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium capitalize">{getDateLabel()}</h4>
          <Badge variant="outline" className="font-mono">
            {selectedDateAppointments.length} citas
          </Badge>
        </div>
        
        <ScrollArea className="flex-1 h-[280px]">
          <div className="space-y-2 pr-4">
            {selectedDateAppointments.map(apt => (
              <div 
                key={apt.id}
                className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono font-medium">{apt.appointment_time}</span>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{apt.patient_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{apt.service_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{apt.location_name}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {selectedDateAppointments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Sin citas programadas</p>
                <p className="text-xs">Selecciona otra fecha</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
