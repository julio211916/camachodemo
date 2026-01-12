import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, FileText, User, Activity, Heart, Gift, FolderOpen, Box, Camera, QrCode, Image as ImageIcon, Stethoscope } from "lucide-react";
import { DashboardLayout, NavGroup } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/layout/DashboardStats";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { Badge } from "@/components/ui/badge";
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

export const PatientDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', user?.email],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').eq('patient_email', user?.email || '').order('appointment_date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('treatments').select('*').eq('patient_id', user?.id || '').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const upcomingAppointments = appointments.filter(a => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled');
  const activeTreatments = treatments.filter(t => t.status === 'in_progress');

  const navGroups: NavGroup[] = useMemo(() => [
    { title: "Principal", items: [
      { id: "dashboard", label: "Resumen", icon: <Calendar className="w-5 h-5" /> },
      { id: "appointments", label: "Mis Citas", icon: <Clock className="w-5 h-5" />, badge: upcomingAppointments.length },
      { id: "treatments", label: "Tratamientos", icon: <FileText className="w-5 h-5" /> },
      { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
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
      { id: "referrals", label: "Referidos", icon: <Gift className="w-5 h-5" /> },
      { id: "photo", label: "Mi Foto", icon: <Camera className="w-5 h-5" /> },
      { id: "qr", label: "Mi QR", icon: <QrCode className="w-5 h-5" /> },
    ]},
  ], [upcomingAppointments.length]);

  const stats = [
    { label: "Próximas Citas", value: upcomingAppointments.length, icon: Calendar, color: "primary" as const },
    { label: "Tratamientos Activos", value: activeTreatments.length, icon: Activity, color: "success" as const },
    { label: "Citas Totales", value: appointments.length, icon: Clock, color: "info" as const },
    { label: "Tratamientos", value: treatments.length, icon: FileText, color: "purple" as const },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": return <><PageHeader title="Mi Portal" subtitle={`Bienvenido, ${profile?.full_name || 'Paciente'}`} /><StatsGrid stats={stats} /></>;
      case "odontogram": return <Odontogram patientId={user?.id || ''} />;
      case "medical": return <MedicalHistory patientId={user?.id || ''} />;
      case "files": return <AdvancedFileManager patientId={user?.id || ''} />;
      case "gallery": return <FileGallery />;
      case "3d": return <Model3DViewer />;
      case "profile": return <MyProfile />;
      case "referrals": return <ReferralSystem />;
      case "photo": return <ProfilePhotoUpload userId={user?.id || ''} userType="patient" />;
      case "qr": return <PatientQRCode patientId={user?.id || ''} patientName={profile?.full_name || ''} patientEmail={user?.email || ''} />;
      default: return <div className="text-muted-foreground text-center py-12">Selecciona una sección</div>;
    }
  };

  return (
    <DashboardLayout navGroups={navGroups} activeItem={activeSection} onNavigate={setActiveSection} title="Mi Portal" subtitle={profile?.full_name || 'Paciente'} userRole="patient">
      {renderContent()}
    </DashboardLayout>
  );
};
