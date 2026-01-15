import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, Clock, FileText, User, Activity, Heart, Gift, FolderOpen, 
  Box, Camera, QrCode, ImageIcon, Stethoscope, Receipt, CreditCard,
  Star, Bell, Phone
} from "lucide-react";
import { DashboardLayout, NavGroup } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/layout/DashboardStats";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReferralSystem } from "@/components/ReferralSystem";
import { MedicalHistory } from "@/components/clinic/MedicalHistory";
import { Odontogram } from "@/components/clinic/Odontogram";
import { AdvancedFileManager } from "@/components/clinic/AdvancedFileManager";
import { ProfilePhotoUpload } from "@/components/clinic/ProfilePhotoUpload";
import { PatientQRCode } from "@/components/clinic/PatientQRCode";
import { FileGallery } from "@/components/clinic/FileGallery";
import { Model3DViewer } from "@/components/clinic/Model3DViewer";
import { MyProfile } from "@/components/dashboard/MyProfile";
import { PatientPortalView } from "@/components/portal/PatientPortalView";
import { DashboardAIAssistant } from "@/components/DashboardAIAssistant";
import { PatientAppointments } from "@/components/patient/PatientAppointments";
import { PatientTreatments } from "@/components/patient/PatientTreatments";
import { PatientInvoices } from "@/components/patient/PatientInvoices";

export const PatientDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', user?.email || '')
        .order('appointment_date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['patient-invoices', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['patient-referrals', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_email', user?.email || '')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.email,
  });

  const upcomingAppointments = appointments.filter(a => 
    new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled'
  );
  const activeTreatments = treatments.filter(t => t.status === 'in_progress');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const completedReferrals = referrals.filter(r => r.status === 'completed');

  const navGroups: NavGroup[] = useMemo(() => [
    { title: "Principal", items: [
      { id: "dashboard", label: "Resumen", icon: <Calendar className="w-5 h-5" /> },
      { id: "appointments", label: "Mis Citas", icon: <Clock className="w-5 h-5" />, badge: upcomingAppointments.length },
      { id: "treatments", label: "Tratamientos", icon: <FileText className="w-5 h-5" />, badge: activeTreatments.length },
      { id: "invoices", label: "Facturas", icon: <Receipt className="w-5 h-5" />, badge: pendingInvoices.length },
    ]},
    { title: "Clínico", items: [
      { id: "odontogram", label: "Odontograma", icon: <Stethoscope className="w-5 h-5" /> },
      { id: "medical", label: "Historia Clínica", icon: <Heart className="w-5 h-5" /> },
    ]},
    { title: "Archivos", items: [
      { id: "files", label: "Mis Archivos", icon: <FolderOpen className="w-5 h-5" /> },
      { id: "gallery", label: "Galería", icon: <ImageIcon className="w-5 h-5" /> },
      { id: "3d", label: "Modelos 3D", icon: <Box className="w-5 h-5" /> },
    ]},
    { title: "Cuenta", items: [
      { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
      { id: "referrals", label: "Referidos", icon: <Gift className="w-5 h-5" />, badge: completedReferrals.length },
      { id: "photo", label: "Mi Foto", icon: <Camera className="w-5 h-5" /> },
      { id: "qr", label: "Mi QR", icon: <QrCode className="w-5 h-5" /> },
    ]},
  ], [upcomingAppointments.length, activeTreatments.length, pendingInvoices.length, completedReferrals.length]);

  const stats = [
    { label: "Próximas Citas", value: upcomingAppointments.length, icon: Calendar, color: "primary" as const },
    { label: "Tratamientos Activos", value: activeTreatments.length, icon: Activity, color: "success" as const },
    { label: "Facturas Pendientes", value: pendingInvoices.length, icon: Receipt, color: "warning" as const },
    { label: "Referidos Exitosos", value: completedReferrals.length, icon: Gift, color: "purple" as const },
  ];

  const renderDashboard = () => (
    <>
      <PageHeader 
        title="Mi Portal" 
        subtitle={`Bienvenido, ${profile?.full_name || 'Paciente'}`} 
      />
      <StatsGrid stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Próximas Citas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximas Citas
            </CardTitle>
            <CardDescription>Tus citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes citas programadas</p>
                <Button className="mt-4" size="sm" onClick={() => setActiveSection("appointments")}>
                  Agendar Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">{apt.service_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.appointment_date), "EEEE d 'de' MMMM", { locale: es })} - {apt.appointment_time}
                      </p>
                    </div>
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length > 3 && (
                  <Button variant="link" className="w-full" onClick={() => setActiveSection("appointments")}>
                    Ver todas ({upcomingAppointments.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tratamientos Activos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Tratamientos Activos
            </CardTitle>
            <CardDescription>Tu progreso actual</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTreatments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes tratamientos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTreatments.slice(0, 3).map((treatment) => (
                  <div key={treatment.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{treatment.name}</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        En Progreso
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Inicio: {format(new Date(treatment.start_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Código QR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Tu Código QR
            </CardTitle>
            <CardDescription>Identificación rápida en la clínica</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="text-center">
              <PatientQRCode 
                patientId={user?.id || ''} 
                patientName={profile?.full_name || ''} 
                patientEmail={user?.email || ''} 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Código: {profile?.patient_code || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Programa de Referidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Programa de Referidos
            </CardTitle>
            <CardDescription>Invita amigos y gana descuentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="bg-primary/10 rounded-xl p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Tu código de referido</p>
                <p className="text-2xl font-bold text-primary">{profile?.referral_code || 'N/A'}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Has referido a <strong>{referrals.length}</strong> personas
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveSection("referrals")}>
                Ver Detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": 
        return renderDashboard();
      case "appointments":
        return <PatientAppointments appointments={appointments} />;
      case "treatments":
        return <PatientTreatments treatments={treatments} />;
      case "invoices": 
        return <PatientInvoices invoices={invoices} />;
      case "odontogram": 
        return <Odontogram patientId={user?.id || ''} />;
      case "medical": 
        return <MedicalHistory patientId={user?.id || ''} />;
      case "files": 
        return <AdvancedFileManager patientId={user?.id || ''} />;
      case "gallery": 
        return <FileGallery />;
      case "3d": 
        return <Model3DViewer />;
      case "profile": 
        return <MyProfile />;
      case "referrals": 
        return <ReferralSystem />;
      case "photo": 
        return <ProfilePhotoUpload userId={user?.id || ''} userType="patient" />;
      case "qr": 
        return <PatientQRCode patientId={user?.id || ''} patientName={profile?.full_name || ''} patientEmail={user?.email || ''} />;
      default: 
        return <div className="text-muted-foreground text-center py-12">Selecciona una sección</div>;
    }
  };

  return (
    <>
      <DashboardLayout 
        navGroups={navGroups} 
        activeItem={activeSection} 
        onNavigate={setActiveSection} 
        title="Mi Portal" 
        subtitle={profile?.full_name || 'Paciente'} 
        userRole="patient"
      >
        {renderContent()}
      </DashboardLayout>
      <DashboardAIAssistant userRole="patient" userName={profile?.full_name} />
    </>
  );
};
