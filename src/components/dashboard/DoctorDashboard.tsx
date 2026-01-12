import { useState } from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  LogOut,
  Stethoscope,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  FolderOpen,
  Pill,
  FileStack,
  Brain,
  Scan,
  Smile,
  Package,
  FlaskConical,
  Receipt,
  DollarSign,
  Sparkles,
  Video,
  PenTool,
  HardDrive,
  Eye,
  FileEdit,
  Box,
  Camera,
  QrCode,
  Cpu,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { TreatmentForm } from "./TreatmentForm";
import { AdvancedFileManager } from "@/components/clinic/AdvancedFileManager";
import { PrescriptionManager } from "@/components/clinic/PrescriptionManager";
import { DocumentTemplates } from "@/components/clinic/DocumentTemplates";
import { XRayAnalysis } from "@/components/clinic/XRayAnalysis";
import { AIReportsModule } from "@/components/clinic/AIReportsModule";
import { SmileSimulator } from "@/components/clinic/SmileSimulator";
import { InventoryManager } from "@/components/clinic/InventoryManager";
import { LabOrdersManager } from "@/components/clinic/LabOrdersManager";
import { InvoicingModule } from "@/components/clinic/InvoicingModule";
import { ExpensesManager } from "@/components/clinic/ExpensesManager";
import { Odontogram } from "@/components/clinic/Odontogram";
import { OrthodonticsModule } from "@/components/clinic/OrthodonticsModule";
import { TelemedicineModule } from "@/components/clinic/TelemedicineModule";
import { DigitalSignature } from "@/components/clinic/DigitalSignature";
import { BackupManager } from "@/components/clinic/BackupManager";
import { DICOMViewer } from "@/components/clinic/DICOMViewer";
import { TemplateEditor } from "@/components/clinic/TemplateEditor";
import { InteractiveOdontogram } from "@/components/clinic/InteractiveOdontogram";
import { Model3DViewer } from "@/components/clinic/Model3DViewer";
import { STLViewer } from "@/components/clinic/STLViewer";
import { ProfilePhotoUpload } from "@/components/clinic/ProfilePhotoUpload";
import { PatientQRCode } from "@/components/clinic/PatientQRCode";
import { FileGallery } from "@/components/clinic/FileGallery";
import logo from "@/assets/logo-novelldent.png";

export const DoctorDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);

  // Fetch doctor info
  const { data: doctorInfo } = useQuery({
    queryKey: ['doctor-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id || '')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all appointments (doctors can see all)
  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch treatments assigned to this doctor
  const { data: treatments = [] } = useQuery({
    queryKey: ['doctor-treatments', doctorInfo?.id],
    queryFn: async () => {
      if (!doctorInfo?.id) return [];
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('doctor_id', doctorInfo.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!doctorInfo?.id,
  });

  // Update appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      toast({
        title: "Estado actualizado",
        description: "La cita ha sido actualizada correctamente.",
      });
    },
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayAppointments = appointments.filter(
    apt => isSameDay(new Date(apt.appointment_date), new Date()) && apt.status !== 'cancelled'
  );

  const selectedDateAppointments = appointments.filter(
    apt => isSameDay(new Date(apt.appointment_date), selectedDate)
  );

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      confirmed: { variant: "default", label: "Confirmada" },
      completed: { variant: "outline", label: "Completada" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), date) && apt.status !== 'cancelled'
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="NovellDent" className="h-10" />
            <div>
              <h1 className="font-serif font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Portal del Doctor
              </h1>
              <p className="text-sm text-muted-foreground">
                Dr. {profile?.full_name || 'Doctor'} {doctorInfo?.specialty && `- ${doctorInfo.specialty}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Citas Hoy</p>
                    <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-3xl font-bold text-amber-600">{pendingAppointments.length}</p>
                  </div>
                  <Clock className="w-10 h-10 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamientos Activos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {treatments.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Esta Semana</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {appointments.filter(apt => {
                        const date = new Date(apt.appointment_date);
                        return date >= weekStart && date <= weekEnd && apt.status !== 'cancelled';
                      }).length}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-2">
              <Clock className="w-4 h-4" />
              Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Users className="w-4 h-4" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="treatments" className="gap-2">
              <FileText className="w-4 h-4" />
              Tratamientos
            </TabsTrigger>
            <TabsTrigger value="odontogram" className="gap-2">
              <Activity className="w-4 h-4" />
              Odontograma
            </TabsTrigger>
            <TabsTrigger value="orthodontics" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ortodoncia
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="lab" className="gap-2">
              <FlaskConical className="w-4 h-4" />
              Laboratorio
            </TabsTrigger>
            <TabsTrigger value="invoicing" className="gap-2">
              <Receipt className="w-4 h-4" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Archivos
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="gap-2">
              <Pill className="w-4 h-4" />
              Recetas
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileStack className="w-4 h-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="xray" className="gap-2">
              <Scan className="w-4 h-4" />
              RX IA
            </TabsTrigger>
            <TabsTrigger value="ai-reports" className="gap-2">
              <Brain className="w-4 h-4" />
              Reportes IA
            </TabsTrigger>
            <TabsTrigger value="smile" className="gap-2">
              <Smile className="w-4 h-4" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="telemedicine" className="gap-2">
              <Video className="w-4 h-4" />
              Telemedicina
            </TabsTrigger>
            <TabsTrigger value="signature" className="gap-2">
              <PenTool className="w-4 h-4" />
              Firma Digital
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <HardDrive className="w-4 h-4" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="dicom" className="gap-2">
              <Eye className="w-4 h-4" />
              DICOM
            </TabsTrigger>
            <TabsTrigger value="template-editor" className="gap-2">
              <FileEdit className="w-4 h-4" />
              Editor Plantillas
            </TabsTrigger>
            <TabsTrigger value="interactive-odontogram" className="gap-2">
              <Cpu className="w-4 h-4" />
              Odontograma SVG
            </TabsTrigger>
            <TabsTrigger value="3d-viewer" className="gap-2">
              <Box className="w-4 h-4" />
              Visor 3D
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Galería
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-2">
              <Camera className="w-4 h-4" />
              Mi Foto
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-2">
              <QrCode className="w-4 h-4" />
              QR Pacientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Calendario Semanal</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[200px] text-center">
                    {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : isToday(day)
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <p className={`text-xs font-medium uppercase ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format(day, "EEE", { locale: es })}
                        </p>
                        <p className={`text-2xl font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                          {format(day, "d")}
                        </p>
                        {dayAppointments.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {dayAppointments.length} citas
                            </Badge>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day Appointments */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-4">
                    Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </h3>
                  {selectedDateAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay citas para este día
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateAppointments
                        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 text-center">
                                <p className="text-lg font-bold text-primary">{apt.appointment_time}</p>
                              </div>
                              <div>
                                <p className="font-medium">{apt.patient_name}</p>
                                <p className="text-sm text-muted-foreground">{apt.service_name}</p>
                                <p className="text-xs text-muted-foreground">{apt.location_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(apt.status)}
                              {apt.status === 'pending' && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => updateAppointmentMutation.mutate({ id: apt.id, status: 'confirmed' })}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                    onClick={() => updateAppointmentMutation.mutate({ id: apt.id, status: 'cancelled' })}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {apt.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAppointmentMutation.mutate({ id: apt.id, status: 'completed' })}
                                >
                                  Completar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Citas de Hoy - {format(new Date(), "d 'de' MMMM", { locale: es })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    No tienes citas programadas para hoy
                  </p>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments
                      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                      .map((apt, index) => (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-4 rounded-xl border border-border"
                        >
                          <div className="w-20 h-20 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold text-primary">{apt.appointment_time}</p>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{apt.patient_name}</p>
                            <p className="text-muted-foreground">{apt.service_name}</p>
                            <p className="text-sm text-muted-foreground">{apt.patient_phone} • {apt.patient_email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(apt.status)}
                            {apt.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentMutation.mutate({ id: apt.id, status: 'completed' })}
                              >
                                Marcar Completada
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Pacientes Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    No hay pacientes registrados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Get unique patients from appointments */}
                    {Array.from(new Set(appointments.map(a => a.patient_email)))
                      .slice(0, 20)
                      .map((email) => {
                        const patientApts = appointments.filter(a => a.patient_email === email);
                        const latestApt = patientApts[0];
                        return (
                          <div
                            key={email}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{latestApt.patient_name}</p>
                                <p className="text-sm text-muted-foreground">{email}</p>
                                <p className="text-xs text-muted-foreground">{latestApt.patient_phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{patientApts.length} citas</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Última: {format(new Date(latestApt.appointment_date), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treatments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Mis Tratamientos
                </CardTitle>
                <Button className="gap-2" onClick={() => setIsTreatmentFormOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Nuevo Tratamiento
                </Button>
              </CardHeader>
              <CardContent>
                {treatments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    No tienes tratamientos asignados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {treatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="p-6 rounded-xl border border-border"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{treatment.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Paciente ID: {treatment.patient_id}
                            </p>
                          </div>
                          {getStatusBadge(treatment.status)}
                        </div>
                        
                        {treatment.diagnosis && (
                          <p className="text-muted-foreground mb-2">
                            <strong>Diagnóstico:</strong> {treatment.diagnosis}
                          </p>
                        )}
                        
                        {treatment.treatment_plan && (
                          <p className="text-muted-foreground mb-2">
                            <strong>Plan:</strong> {treatment.treatment_plan}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                          <span className="text-muted-foreground">
                            Inicio: {format(new Date(treatment.start_date), "d MMM yyyy", { locale: es })}
                          </span>
                          {treatment.cost && (
                            <span className="font-medium">€{treatment.cost}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Odontogram Tab */}
          <TabsContent value="odontogram">
            <Odontogram patientId="demo-patient" />
          </TabsContent>

          {/* Orthodontics Tab */}
          <TabsContent value="orthodontics">
            <OrthodonticsModule />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>

          {/* Lab Orders Tab */}
          <TabsContent value="lab">
            <LabOrdersManager />
          </TabsContent>

          {/* Invoicing Tab */}
          <TabsContent value="invoicing">
            <InvoicingModule />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <ExpensesManager />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <AdvancedFileManager patientId="" patientName="Todos los pacientes" />
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <PrescriptionManager />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="templates">
            <DocumentTemplates />
          </TabsContent>

          {/* X-Ray Analysis Tab */}
          <TabsContent value="xray">
            <XRayAnalysis />
          </TabsContent>

          {/* AI Reports Tab */}
          <TabsContent value="ai-reports">
            <AIReportsModule />
          </TabsContent>

          {/* Smile Simulator Tab */}
          <TabsContent value="smile">
            <SmileSimulator />
          </TabsContent>

          {/* Telemedicine Tab */}
          <TabsContent value="telemedicine">
            <TelemedicineModule userRole="doctor" />
          </TabsContent>

          {/* Digital Signature Tab */}
          <TabsContent value="signature">
            <DigitalSignature patientId="demo-patient" patientName="Paciente Demo" />
          </TabsContent>

          {/* Backup Manager Tab */}
          <TabsContent value="backup">
            <BackupManager />
          </TabsContent>

          {/* DICOM Viewer Tab */}
          <TabsContent value="dicom">
            <DICOMViewer />
          </TabsContent>

          {/* Template Editor Tab */}
          <TabsContent value="template-editor">
            <TemplateEditor />
          </TabsContent>

          {/* Interactive Odontogram Tab */}
          <TabsContent value="interactive-odontogram">
            <InteractiveOdontogram patientId="demo-patient" />
          </TabsContent>

          {/* 3D Viewer Tab */}
          <TabsContent value="3d-viewer">
            <Model3DViewer />
          </TabsContent>

          {/* File Gallery Tab */}
          <TabsContent value="gallery">
            <FileGallery patientId="demo-patient" patientName="Mis Archivos" />
          </TabsContent>

          {/* Profile Photos Tab */}
          <TabsContent value="profiles">
            <ProfilePhotoUpload userId={user?.id || ''} userType="doctor" currentPhotoUrl={profile?.avatar_url || undefined} userName={profile?.full_name} />
          </TabsContent>

          {/* Patient QR Codes Tab */}
          <TabsContent value="qr">
            <PatientQRCode patientId="demo-patient" patientName="Paciente Demo" patientEmail="demo@example.com" />
          </TabsContent>
        </Tabs>
      </main>

      {/* Treatment Form Modal */}
      {doctorInfo?.id && (
        <TreatmentForm
          doctorId={doctorInfo.id}
          isOpen={isTreatmentFormOpen}
          onClose={() => setIsTreatmentFormOpen(false)}
        />
      )}
    </div>
  );
};
