import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar, Clock, Users, FileText, Stethoscope, Activity, TrendingUp,
  FolderOpen, Pill, FileStack, Brain, Scan, Smile, Package, FlaskConical,
  Receipt, DollarSign, Sparkles, Video, PenTool, HardDrive, Eye, FileEdit,
  Box, Camera, QrCode, Cpu, Image as ImageIcon, User, ClipboardList, Layers,
  CalendarDays, Wallet, Target, MessageSquare, Settings, Bell
} from "lucide-react";
import { DashboardLayout, NavGroup } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/layout/DashboardStats";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdvancedFileManager } from "@/components/clinic/AdvancedFileManager";
import { PrescriptionManager } from "@/components/clinic/PrescriptionManager";
import { DocumentTemplates } from "@/components/clinic/DocumentTemplates";
import { Odontogram } from "@/components/clinic/Odontogram";
import { OrthodonticsModule } from "@/components/clinic/OrthodonticsModule";
import { FileGallery } from "@/components/clinic/FileGallery";
import { MyProfile } from "@/components/dashboard/MyProfile";
import { PatientManager } from "@/components/clinic/PatientManager";
import { DiagnocatViewer } from "@/components/clinic/DiagnocatViewer";
import { EnhancedOdontogram } from "@/components/clinic/EnhancedOdontogram";
import { ClinicalDocumentsEditor } from "@/components/clinic/ClinicalDocumentsEditor";
import { ComprehensivePatientProfile } from "@/components/clinic/ComprehensivePatientProfile";
import { PaymentPlanCalculator } from "@/components/clinic/PaymentPlanCalculator";
import { TreatmentProgressDashboard } from "@/components/clinic/TreatmentProgressDashboard";
import { TreatmentPlanGenerator } from "@/components/clinic/TreatmentPlanGenerator";
import { AgendaModule } from "@/components/portal/AgendaModule";
import { CajasModule } from "@/components/portal/CajasModule";

export const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').order('appointment_date');
      return data || [];
    },
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['doctor-treatments'],
    queryFn: async () => {
      const { data } = await supabase.from('treatments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const todayAppointments = appointments.filter(apt => isSameDay(new Date(apt.appointment_date), new Date()));

  const navGroups: NavGroup[] = useMemo(() => [
    { 
      title: "Mi Día", 
      items: [
        { id: "dashboard", label: "Dashboard", icon: <Calendar className="w-5 h-5" /> },
        { id: "agenda", label: "Mi Agenda", icon: <CalendarDays className="w-5 h-5" />, badge: todayAppointments.length },
        { id: "patients", label: "Mis Pacientes", icon: <Users className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Atención Clínica", 
      items: [
        { id: "patient-profile", label: "Ficha Paciente", icon: <User className="w-5 h-5" /> },
        { id: "enhanced-odontogram", label: "Odontograma", icon: <Stethoscope className="w-5 h-5" /> },
        { id: "dental-3d", label: "Visor 3D", icon: <Box className="w-5 h-5" /> },
        { id: "treatment-plan", label: "Plan Tratamiento", icon: <Target className="w-5 h-5" /> },
        { id: "treatment-progress", label: "Progreso", icon: <Activity className="w-5 h-5" /> },
        { id: "orthodontics", label: "Ortodoncia", icon: <Sparkles className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Pagos & Finanzas", 
      items: [
        { id: "cajas", label: "Cobros", icon: <Wallet className="w-5 h-5" /> },
        { id: "payment-plans", label: "Planes de Pago", icon: <Wallet className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Documentos", 
      items: [
        { id: "files", label: "Archivos Paciente", icon: <FolderOpen className="w-5 h-5" /> },
        { id: "gallery", label: "Galería Fotos", icon: <ImageIcon className="w-5 h-5" /> },
        { id: "prescriptions", label: "Recetas", icon: <Pill className="w-5 h-5" /> },
        { id: "templates", label: "Plantillas", icon: <FileStack className="w-5 h-5" /> },
        { id: "clinical-docs", label: "Notas Clínicas", icon: <ClipboardList className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Mi Cuenta", 
      items: [
        { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
      ]
    },
  ], [todayAppointments.length]);

  const stats = [
    { label: "Citas Hoy", value: todayAppointments.length, icon: Calendar, color: "primary" as const },
    { label: "Pendientes", value: appointments.filter(a => a.status === "pending").length, icon: Clock, color: "warning" as const },
    { label: "Tratamientos Activos", value: treatments.filter(t => t.status === "in_progress").length, icon: Activity, color: "success" as const },
    { label: "Esta Semana", value: appointments.filter(a => { const d = new Date(a.appointment_date); return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date()); }).length, icon: TrendingUp, color: "info" as const },
  ];

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const renderContent = () => {
    // If a patient is selected, show their profile
    if (selectedPatientId && activeSection === "patient-profile") {
      return (
        <ComprehensivePatientProfile 
          patientId={selectedPatientId} 
          onBack={() => {
            setSelectedPatientId(null);
            setActiveSection("patients");
          }}
        />
      );
    }

    switch (activeSection) {
      case "dashboard": 
        return (
          <DashboardWidgets 
            appointments={appointments} 
            treatments={treatments}
            userRole="doctor" 
            userName={profile?.full_name || 'Doctor'}
          />
        );
      case "agenda":
        return <AgendaModule />;
      case "cajas":
        return <CajasModule />;
      case "patients": 
        return <PatientManager />;
      case "orthodontics": 
        return <OrthodonticsModule patientId="demo" />;
      case "enhanced-odontogram":
        return <EnhancedOdontogram patientId="demo-patient" />;
      case "dental-3d":
        return <DiagnocatViewer patientId="demo-patient" patientName="Paciente Demo" />;
      case "patient-profile":
        return <ComprehensivePatientProfile patientId={selectedPatientId || undefined} />;
      case "files": 
        return <AdvancedFileManager patientId="demo" />;
      case "gallery": 
        return <FileGallery />;
      case "prescriptions": 
        return <PrescriptionManager />;
      case "templates": 
        return <DocumentTemplates />;
      case "clinical-docs":
        return <ClinicalDocumentsEditor />;
      case "treatment-plan":
        return <TreatmentPlanGenerator doctorName={profile?.full_name || "Doctor"} />;
      case "profile": 
        return <MyProfile />;
      case "treatment-progress":
        return <TreatmentProgressDashboard />;
      case "payment-plans":
        return <PaymentPlanCalculator treatmentTotal={0} />;
      default: 
        return <div className="text-muted-foreground text-center py-12">Selecciona una sección</div>;
    }
  };

  return (
    <DashboardLayout navGroups={navGroups} activeItem={activeSection} onNavigate={setActiveSection} title="Portal del Doctor" subtitle={`Dr. ${profile?.full_name || ''}`} userRole="doctor">
      {renderContent()}
    </DashboardLayout>
  );
};
