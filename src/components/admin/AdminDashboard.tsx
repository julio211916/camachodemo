import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock4,
  Trash2,
  Loader2,
  CalendarDays,
  Stethoscope,
  MoreVertical,
  BarChart3,
  MessageSquare,
  Bell,
  TrendingUp,
  FolderOpen,
  Pill,
  FileStack,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments, useUpdateAppointmentStatus, useDeleteAppointment, Appointment } from "@/hooks/useAppointments";
import { useRealtimeAppointments, useRealtimeReviews } from "@/hooks/useRealtimeNotifications";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import { DoctorsManager } from "./DoctorsManager";
import { ReviewsManager } from "./ReviewsManager";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { ExportData } from "./ExportData";
import { FileGallery } from "@/components/clinic/FileGallery";
import { PrescriptionManager } from "@/components/clinic/PrescriptionManager";
import { DocumentTemplates } from "@/components/clinic/DocumentTemplates";
import { ReferralsManager } from "./ReferralsManager";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-novelldent.png";

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    icon: Clock4,
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
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

export const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  // Enable realtime notifications
  useRealtimeAppointments(true);
  useRealtimeReviews(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("appointments");

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesLocation = locationFilter === "all" || apt.location_id === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Get unique locations for filter
  const locations = [...new Set(appointments.map((a) => a.location_id))];

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container-wide py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="NovellDent" className="h-10" />
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground">
                  Panel de Administración
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container-wide py-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full max-w-4xl">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Citas</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Doctores</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Reseñas</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Archivos</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Recetas</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileStack className="w-4 h-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Referidos</span>
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Citas", value: appointments.length, icon: CalendarDays, color: "text-primary" },
                { label: "Pendientes", value: appointments.filter((a) => a.status === "pending").length, icon: Clock4, color: "text-yellow-500" },
                { label: "Confirmadas", value: appointments.filter((a) => a.status === "confirmed").length, icon: CheckCircle2, color: "text-green-500" },
                { label: "Hoy", value: appointments.filter((a) => isToday(parseISO(a.appointment_date))).length, icon: Calendar, color: "text-blue-500" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="pl-12 h-12 rounded-xl"
                  />
                </div>
                <div className="flex gap-4 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-12 rounded-xl">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="confirmed">Confirmadas</SelectItem>
                      <SelectItem value="completed">Completadas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[160px] h-12 rounded-xl">
                      <MapPin className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ExportData appointments={appointments} filteredAppointments={filteredAppointments} />
                </div>
              </div>
            </div>

            {/* Appointments List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Cargando citas...</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-20">
                <CalendarDays className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No hay citas</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || locationFilter !== "all"
                    ? "No se encontraron citas con los filtros seleccionados."
                    : "Aún no hay citas agendadas."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((date) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {getDateLabel(date)}
                      </h2>
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="secondary" className="rounded-full">
                        {groupedAppointments[date].length} citas
                      </Badge>
                    </div>

                    <div className="grid gap-4">
                      <AnimatePresence>
                        {groupedAppointments[date]
                          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                          .map((appointment) => {
                            const status = statusConfig[appointment.status];
                            const StatusIcon = status.icon;

                            return (
                              <motion.div
                                key={appointment.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                  "bg-card rounded-2xl border border-border/50 p-6 transition-all hover:shadow-lg",
                                  isPast(parseISO(appointment.appointment_date)) &&
                                    appointment.status !== "completed" &&
                                    "opacity-70"
                                )}
                              >
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                  {/* Time */}
                                  <div className="flex items-center gap-4 md:w-32">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                      <Clock className="w-6 h-6 text-primary" />
                                    </div>
                                    <span className="text-2xl font-bold text-foreground">
                                      {appointment.appointment_time}
                                    </span>
                                  </div>

                                  {/* Patient Info */}
                                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold text-foreground">
                                          {appointment.patient_name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${appointment.patient_phone}`} className="hover:text-primary">
                                          {appointment.patient_phone}
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        <a href={`mailto:${appointment.patient_email}`} className="hover:text-primary">
                                          {appointment.patient_email}
                                        </a>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-foreground">{appointment.location_name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-foreground">{appointment.service_name}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status & Actions */}
                                  <div className="flex items-center gap-3">
                                    <Badge className={cn("rounded-full px-4 py-1.5", status.color)}>
                                      <StatusIcon className="w-4 h-4 mr-1.5" />
                                      {status.label}
                                    </Badge>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                          <MoreVertical className="w-5 h-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateStatus.mutate({ id: appointment.id, status: "confirmed" })
                                          }
                                          disabled={appointment.status === "confirmed"}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                          Confirmar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateStatus.mutate({ id: appointment.id, status: "completed" })
                                          }
                                          disabled={appointment.status === "completed"}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" />
                                          Completar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateStatus.mutate({ id: appointment.id, status: "cancelled" })
                                          }
                                          disabled={appointment.status === "cancelled"}
                                        >
                                          <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                          Cancelar
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                              onSelect={(e) => e.preventDefault()}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Eliminar
                                            </DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción no se puede deshacer. La cita de{" "}
                                                <strong>{appointment.patient_name}</strong> será eliminada
                                                permanentemente.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => deleteAppointment.mutate(appointment.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <AppointmentCalendar appointments={appointments} />
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors">
            <DoctorsManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced">
            <AdvancedAnalytics />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <ReviewsManager />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <FileGallery />
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <PrescriptionManager />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="templates">
            <DocumentTemplates />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <ReferralsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
