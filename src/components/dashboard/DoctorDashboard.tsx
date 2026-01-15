import { useState, useMemo } from "react";
import { format, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar, Clock, Users, FileText, Stethoscope, Activity, TrendingUp,
  FolderOpen, Pill, FileStack, Box, ImageIcon, User, ClipboardList,
  CalendarDays, Wallet, Target, MessageSquare, Sparkles, StickyNote
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
import { DashboardAIAssistant } from "@/components/DashboardAIAssistant";
import { DoctorPatientNotes } from "@/components/clinic/DoctorPatientNotes";
import { DoctorAssignedPatients } from "@/components/clinic/DoctorAssignedPatients";

export const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  

  // Get doctor record for current user
  const { data: doctorRecord } = useQuery({
    queryKey: ['doctor-record', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id || '')
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get assigned patients for this doctor
  const { data: assignedPatients = [] } = useQuery({
    queryKey: ['doctor-assigned-patients', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctor_patients')
        .select(`
          id,
          is_primary,
          assigned_at,
          patient_profile_id,
          profiles:patient_profile_id (
            id,
            user_id,
            full_name,
            email,
            phone,
            avatar_url,
            location_id
          )
        `)
        .eq('doctor_id', user?.id || '');
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get appointments for assigned patients
  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    queryFn: async () => {
      const patientEmails = assignedPatients.map((p: any) => p.profiles?.email).filter(Boolean);
      if (patientEmails.length === 0) return [];
      
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .in('patient_email', patientEmails)
        .order('appointment_date');
      return data || [];
    },
    enabled: assignedPatients.length > 0,
  });

  // Get treatments for assigned patients
  const { data: treatments = [] } = useQuery({
    queryKey: ['doctor-treatments', user?.id],
    queryFn: async () => {
      const patientIds = assignedPatients.map((p: any) => p.profiles?.user_id).filter(Boolean);
      if (patientIds.length === 0) return [];
      
      const { data } = await supabase
        .from('treatments')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: assignedPatients.length > 0,
  });

  const todayAppointments = appointments.filter(apt => isSameDay(new Date(apt.appointment_date), new Date()));

  const navGroups: NavGroup[] = useMemo(() => [
    { 
      title: "Mi Día", 
      items: [
        { id: "dashboard", label: "Dashboard", icon: <Calendar className="w-5 h-5" /> },
        { id: "agenda", label: "Mi Agenda", icon: <CalendarDays className="w-5 h-5" />, badge: todayAppointments.length },
        { id: "my-patients", label: "Mis Pacientes", icon: <Users className="w-5 h-5" />, badge: assignedPatients.length },
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
        { id: "patient-notes", label: "Notas Clínicas", icon: <StickyNote className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Pagos", 
      items: [
        { id: "cajas", label: "Cobros", icon: <Wallet className="w-5 h-5" /> },
        { id: "payment-plans", label: "Planes de Pago", icon: <Wallet className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Documentos", 
      items: [
        { id: "files", label: "Archivos", icon: <FolderOpen className="w-5 h-5" /> },
        { id: "gallery", label: "Galería", icon: <ImageIcon className="w-5 h-5" /> },
        { id: "prescriptions", label: "Recetas", icon: <Pill className="w-5 h-5" /> },
        { id: "templates", label: "Plantillas", icon: <FileStack className="w-5 h-5" /> },
      ]
    },
    { 
      title: "Mi Cuenta", 
      items: [
        { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
      ]
    },
  ], [todayAppointments.length, assignedPatients.length]);

  const stats = [
    { label: "Citas Hoy", value: todayAppointments.length, icon: Calendar, color: "primary" as const },
    { label: "Mis Pacientes", value: assignedPatients.length, icon: Users, color: "info" as const },
    { label: "Tratamientos Activos", value: treatments.filter(t => t.status === "in_progress").length, icon: Activity, color: "success" as const },
    { label: "Esta Semana", value: appointments.filter(a => { 
      const d = new Date(a.appointment_date); 
      return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date()); 
    }).length, icon: TrendingUp, color: "warning" as const },
  ];

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const renderContent = () => {
    // Use selected patient from state
    const patientId = selectedPatientId;

    if (selectedPatientId && activeSection === "patient-profile") {
      return (
        <ComprehensivePatientProfile 
          patientId={selectedPatientId} 
          onBack={() => {
            setSelectedPatientId(null);
            setActiveSection("my-patients");
          }}
        />
      );
    }

    switch (activeSection) {
      case "dashboard": 
        return (
          <>
            <PageHeader 
              title="Mi Dashboard" 
              subtitle={`Bienvenido, Dr. ${profile?.full_name || ''}`} 
            />
            <StatsGrid stats={stats} />
            <DashboardWidgets 
              appointments={appointments} 
              treatments={treatments}
              userRole="doctor" 
              userName={profile?.full_name || 'Doctor'}
            />
          </>
        );
      case "agenda":
        return <AgendaModule />;
      case "cajas":
        return <CajasModule />;
      case "my-patients": 
        return (
          <DoctorAssignedPatients 
            doctorId={user?.id || ''} 
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveSection("patient-profile");
            }}
          />
        );
      case "orthodontics": 
        return <OrthodonticsModule patientId={patientId || "demo"} />;
      case "enhanced-odontogram":
        return <EnhancedOdontogram patientId={patientId || "demo-patient"} />;
      case "dental-3d":
        return <DiagnocatViewer patientId={patientId || "demo-patient"} patientName="Paciente" />;
      case "patient-profile":
        return <ComprehensivePatientProfile patientId={patientId || undefined} />;
      case "patient-notes":
        return <DoctorPatientNotes patientId={patientId || ''} doctorId={user?.id || ''} />;
      case "files": 
        return <AdvancedFileManager patientId={patientId || "demo"} />;
      case "gallery": 
        return <FileGallery />;
      case "prescriptions": 
        return <PrescriptionManager />;
      case "templates": 
        return <DocumentTemplates />;
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
    <>
      <DashboardLayout 
        navGroups={navGroups} 
        activeItem={activeSection} 
        onNavigate={setActiveSection} 
        title="Portal del Doctor" 
        subtitle={`Dr. ${profile?.full_name || ''}`} 
        userRole="doctor"
      >
        {renderContent()}
      </DashboardLayout>
      <DashboardAIAssistant userRole="doctor" userName={profile?.full_name} />
    </>
  );
};
