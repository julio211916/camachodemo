import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar, Clock, Users, FileText, Stethoscope, Activity, TrendingUp,
  FolderOpen, Pill, FileStack, Brain, Scan, Smile, Package, FlaskConical,
  Receipt, DollarSign, Sparkles, Video, PenTool, HardDrive, Eye, FileEdit,
  Box, Camera, QrCode, Cpu, Image as ImageIcon, User, ClipboardList, Layers
} from "lucide-react";
import { DashboardLayout, NavGroup } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/layout/DashboardStats";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Model3DViewerCloud } from "@/components/clinic/Model3DViewerCloud";
import { ProfilePhotoUpload } from "@/components/clinic/ProfilePhotoUpload";
import { PatientQRCode } from "@/components/clinic/PatientQRCode";
import { FileGallery } from "@/components/clinic/FileGallery";
import { MyProfile } from "@/components/dashboard/MyProfile";
import { ClinicKanbanBoard } from "@/components/clinic/ClinicKanbanBoard";
import { PatientManager } from "@/components/clinic/PatientManager";
import { CBCTPanoramicGenerator } from "@/components/clinic/CBCTPanoramicGenerator";

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
    { title: "Principal", items: [
      { id: "dashboard", label: "Dashboard", icon: <Calendar className="w-5 h-5" /> },
      { id: "kanban", label: "Kanban", icon: <ClipboardList className="w-5 h-5" /> },
      { id: "today", label: "Citas Hoy", icon: <Clock className="w-5 h-5" />, badge: todayAppointments.length },
      { id: "patients", label: "Pacientes", icon: <Users className="w-5 h-5" /> },
      { id: "treatments", label: "Tratamientos", icon: <FileText className="w-5 h-5" /> },
    ]},
    { title: "Clínica", items: [
      { id: "orthodontics", label: "Ortodoncia", icon: <Sparkles className="w-5 h-5" /> },
      { id: "inventory", label: "Inventario", icon: <Package className="w-5 h-5" /> },
      { id: "lab", label: "Laboratorio", icon: <FlaskConical className="w-5 h-5" /> },
    ]},
    { title: "IA & Diagnóstico", items: [
      { id: "xray", label: "Análisis RX", icon: <Scan className="w-5 h-5" /> },
      { id: "ai-reports", label: "Reportes IA", icon: <Brain className="w-5 h-5" /> },
      { id: "smile", label: "Diseño Sonrisa", icon: <Smile className="w-5 h-5" /> },
    ]},
    { title: "Documentos", items: [
      { id: "files", label: "Archivos", icon: <FolderOpen className="w-5 h-5" /> },
      { id: "gallery", label: "Galería", icon: <ImageIcon className="w-5 h-5" /> },
      { id: "prescriptions", label: "Recetas", icon: <Pill className="w-5 h-5" /> },
      { id: "templates", label: "Plantillas", icon: <FileStack className="w-5 h-5" /> },
      { id: "signature", label: "Firma Digital", icon: <PenTool className="w-5 h-5" /> },
    ]},
    { title: "Imagenología", items: [
      { id: "dicom", label: "Visor DICOM", icon: <Eye className="w-5 h-5" /> },
      { id: "cbct-panoramic", label: "Panorámica CBCT", icon: <Layers className="w-5 h-5" /> },
      { id: "3d-viewer", label: "Visor 3D", icon: <Box className="w-5 h-5" /> },
    ]},
    { title: "Cuenta", items: [
      { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
    ]},
  ], [todayAppointments.length]);

  const stats = [
    { label: "Citas Hoy", value: todayAppointments.length, icon: Calendar, color: "primary" as const },
    { label: "Pendientes", value: appointments.filter(a => a.status === "pending").length, icon: Clock, color: "warning" as const },
    { label: "Tratamientos Activos", value: treatments.filter(t => t.status === "in_progress").length, icon: Activity, color: "success" as const },
    { label: "Esta Semana", value: appointments.filter(a => { const d = new Date(a.appointment_date); return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date()); }).length, icon: TrendingUp, color: "info" as const },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": return <><PageHeader title="Dashboard" subtitle={`Dr. ${profile?.full_name || 'Doctor'}`} /><StatsGrid stats={stats} /></>;
      case "kanban": return <ClinicKanbanBoard />;
      case "patients": return <PatientManager />;
      case "orthodontics": return <OrthodonticsModule patientId="demo" />;
      case "inventory": return <InventoryManager />;
      case "lab": return <LabOrdersManager />;
      case "xray": return <XRayAnalysis />;
      case "ai-reports": return <AIReportsModule />;
      case "smile": return <SmileSimulator />;
      case "files": return <AdvancedFileManager patientId="demo" />;
      case "gallery": return <FileGallery />;
      case "prescriptions": return <PrescriptionManager />;
      case "templates": return <DocumentTemplates />;
      case "signature": return <DigitalSignature />;
      case "dicom": return <DICOMViewer />;
      case "cbct-panoramic": return <CBCTPanoramicGenerator patientId="demo" patientName="Paciente Demo" />;
      case "3d-viewer": return <Model3DViewerCloud patientId="demo" patientName="Paciente Demo" />;
      case "profile": return <MyProfile />;
      default: return <div className="text-muted-foreground text-center py-12">Selecciona una sección</div>;
    }
  };

  return (
    <DashboardLayout navGroups={navGroups} activeItem={activeSection} onNavigate={setActiveSection} title="Portal del Doctor" subtitle={`Dr. ${profile?.full_name || ''}`} userRole="doctor">
      {renderContent()}
    </DashboardLayout>
  );
};
