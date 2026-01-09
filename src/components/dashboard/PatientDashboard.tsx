import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  FileText,
  User,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Activity,
  Plus,
  ChevronRight,
  Heart,
  Pill,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo-novelldent.png";

export const PatientDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch patient's appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', user?.email || '')
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  // Fetch patient's treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch medical history
  const { data: medicalHistory } = useQuery({
    queryKey: ['medical-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', user?.id || '')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const upcomingAppointments = appointments.filter(
    a => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled'
  );

  const pastAppointments = appointments.filter(
    a => new Date(a.appointment_date) < new Date() || a.status === 'completed'
  );

  const activeTreatments = treatments.filter(t => t.status === 'in_progress');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      confirmed: { variant: "default", label: "Confirmada" },
      completed: { variant: "outline", label: "Completada" },
      cancelled: { variant: "destructive", label: "Cancelada" },
      in_progress: { variant: "default", label: "En Progreso" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="NovellDent" className="h-10" />
            <div>
              <h1 className="font-serif font-bold text-foreground">Mi Portal</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {profile?.full_name || 'Paciente'}</p>
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
                    <p className="text-sm text-muted-foreground">Próximas Citas</p>
                    <p className="text-3xl font-bold text-primary">{upcomingAppointments.length}</p>
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
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamientos Activos</p>
                    <p className="text-3xl font-bold text-green-600">{activeTreatments.length}</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Citas Totales</p>
                    <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
                  </div>
                  <Clock className="w-10 h-10 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamientos</p>
                    <p className="text-3xl font-bold text-purple-600">{treatments.length}</p>
                  </div>
                  <FileText className="w-10 h-10 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Calendar className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Clock className="w-4 h-4" />
              Mis Citas
            </TabsTrigger>
            <TabsTrigger value="treatments" className="gap-2">
              <FileText className="w-4 h-4" />
              Tratamientos
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Mi Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Appointments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Próximas Citas</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/#citas">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Cita
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tienes citas programadas
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{apt.service_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(apt.appointment_date), "d 'de' MMMM", { locale: es })} - {apt.appointment_time}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {apt.location_name}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Treatments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tratamientos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTreatments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tienes tratamientos activos
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activeTreatments.map((treatment) => (
                        <div
                          key={treatment.id}
                          className="p-4 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{treatment.name}</p>
                            {getStatusBadge(treatment.status)}
                          </div>
                          {treatment.description && (
                            <p className="text-sm text-muted-foreground">
                              {treatment.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Iniciado: {format(new Date(treatment.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical History Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Información Médica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!medicalHistory ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay información médica registrada
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <p className="font-medium text-red-700 dark:text-red-400">Alergias</p>
                        </div>
                        {medicalHistory.allergies?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.allergies.map((allergy: string, i: number) => (
                              <Badge key={i} variant="outline" className="border-red-500/50">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin alergias conocidas</p>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-5 h-5 text-blue-500" />
                          <p className="font-medium text-blue-700 dark:text-blue-400">Medicamentos</p>
                        </div>
                        {medicalHistory.medications?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.medications.map((med: string, i: number) => (
                              <Badge key={i} variant="outline" className="border-blue-500/50">
                                {med}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin medicamentos</p>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-5 h-5 text-purple-500" />
                          <p className="font-medium text-purple-700 dark:text-purple-400">Condiciones</p>
                        </div>
                        {medicalHistory.conditions?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.conditions.map((cond: string, i: number) => (
                              <Badge key={i} variant="outline" className="border-purple-500/50">
                                {cond}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin condiciones</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historial de Citas</CardTitle>
                <Button variant="outline" asChild>
                  <a href="/#citas">
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    No tienes citas registradas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {format(new Date(apt.appointment_date), "d")}
                            </span>
                            <span className="text-xs text-primary/70 uppercase">
                              {format(new Date(apt.appointment_date), "MMM", { locale: es })}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{apt.service_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt.appointment_time} - {apt.location_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(apt.status)}
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle>Mis Tratamientos</CardTitle>
              </CardHeader>
              <CardContent>
                {treatments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    No tienes tratamientos registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {treatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="p-6 rounded-xl border border-border"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{treatment.name}</h3>
                            {treatment.diagnosis && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Diagnóstico: {treatment.diagnosis}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(treatment.status)}
                        </div>

                        {treatment.description && (
                          <p className="text-muted-foreground mb-4">{treatment.description}</p>
                        )}

                        {treatment.treatment_plan && (
                          <div className="p-4 rounded-lg bg-secondary/50 mb-4">
                            <p className="text-sm font-medium mb-1">Plan de Tratamiento:</p>
                            <p className="text-sm text-muted-foreground">{treatment.treatment_plan}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Inicio: {format(new Date(treatment.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                          {treatment.cost && (
                            <span className="font-medium">
                              Costo: €{treatment.cost}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">{profile?.full_name || 'No especificado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Correo</p>
                        <p className="font-medium">{profile?.email || user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{profile?.phone || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                        <p className="font-medium">
                          {profile?.date_of_birth 
                            ? format(new Date(profile.date_of_birth), "d 'de' MMMM, yyyy", { locale: es })
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Dirección</p>
                        <p className="font-medium">{profile?.address || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
