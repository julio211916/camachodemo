import { useState } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock4,
  Trash2,
  Loader2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUpdateAppointmentStatus, useDeleteAppointment, Appointment } from "@/hooks/useAppointments";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Clock4,
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
    icon: XCircle,
  },
  completed: {
    label: "Completada",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    icon: CheckCircle2,
  },
};

interface AdminAppointmentsListProps {
  appointments: Appointment[];
  compact?: boolean;
}

export const AdminAppointmentsList = ({ appointments, compact = false }: AdminAppointmentsListProps) => {
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesLocation = locationFilter === "all" || apt.location_id === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  const locations = [...new Set(appointments.map((a) => a.location_id))];

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  if (compact) {
    return (
      <div className="space-y-3">
        {appointments.slice(0, 5).map((apt) => (
          <div
            key={apt.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{apt.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(apt.appointment_date), "d MMM", { locale: es })} - {apt.appointment_time}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-xs", statusConfig[apt.status]?.color)}>
              {statusConfig[apt.status]?.label}
            </Badge>
          </div>
        ))}
        {appointments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay citas programadas</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Citas" subtitle="Administra todas las citas de la clínica" />
      
      {/* Filters */}
      <ContentCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[140px]">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ContentCard>

      {/* Appointments List */}
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
              {getDateLabel(date)}
            </h3>
            <div className="grid gap-3">
              {groupedAppointments[date].map((apt, index) => {
                const StatusIcon = statusConfig[apt.status]?.icon || Clock4;
                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{apt.patient_name}</h4>
                            <Badge variant="outline" className={cn("text-xs", statusConfig[apt.status]?.color)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[apt.status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-primary font-medium mt-1">{apt.service_name}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {apt.appointment_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {apt.location_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {apt.patient_phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {apt.patient_email}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: apt.id, status: "confirmed" })}
                            disabled={apt.status === "confirmed"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: apt.id, status: "completed" })}
                            disabled={apt.status === "completed"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" />
                            Completar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelled" })}
                            disabled={apt.status === "cancelled"}
                            className="text-red-500"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteAppointment.mutate(apt.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        
        {sortedDates.length === 0 && (
          <ContentCard>
            <p className="text-center text-muted-foreground py-12">
              No se encontraron citas con los filtros seleccionados
            </p>
          </ContentCard>
        )}
      </div>
    </div>
  );
};
