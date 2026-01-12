import { useState, useMemo } from "react";
import { format, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  Clock4,
  CheckCircle2,
  Users,
  Stethoscope,
  Package,
  FlaskConical,
  Wallet,
  Receipt,
  DollarSign,
  Activity,
  Sparkles,
  Gift,
  BarChart3,
  TrendingUp,
  MessageSquare,
  FolderOpen,
  Pill,
  FileStack,
  Scan,
  Brain,
  Smile,
  Headphones,
  MessagesSquare,
  Video,
  PenTool,
  HardDrive,
  Eye,
  FileEdit,
  Box,
  Camera,
  QrCode,
  Layout,
  Image as ImageIcon,
  Cpu,
  Bell,
  ClipboardList,
  Building2,
  Shield,
  FileText,
  User
} from "lucide-react";
import { DashboardLayout, NavGroup } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/layout/DashboardStats";
import { ContentCard, PageHeader } from "@/components/layout/ContentCard";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { useRealtimeAppointments, useRealtimeReviews } from "@/hooks/useRealtimeNotifications";

// Module imports
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import { DoctorsManager } from "./DoctorsManager";
import { ReviewsManager } from "./ReviewsManager";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AdvancedFileManager } from "@/components/clinic/AdvancedFileManager";
import { PrescriptionManager } from "@/components/clinic/PrescriptionManager";
import { DocumentTemplates } from "@/components/clinic/DocumentTemplates";
import { ReferralsManager } from "./ReferralsManager";
import { XRayAnalysis } from "@/components/clinic/XRayAnalysis";
import { AIReportsModule } from "@/components/clinic/AIReportsModule";
import { SmileSimulator } from "@/components/clinic/SmileSimulator";
import { ContactCenterModule } from "@/components/clinic/ContactCenterModule";
import { InternalChatModule } from "@/components/clinic/InternalChatModule";
import { InventoryManager } from "@/components/clinic/InventoryManager";
import { LabOrdersManager } from "@/components/clinic/LabOrdersManager";
import { CashRegisterModule } from "@/components/clinic/CashRegisterModule";
import { InvoicingModule } from "@/components/clinic/InvoicingModule";
import { ExpensesManager } from "@/components/clinic/ExpensesManager";
import { Odontogram } from "@/components/clinic/Odontogram";
import { OrthodonticsModule } from "@/components/clinic/OrthodonticsModule";
import { FacialAestheticsModule } from "@/components/clinic/FacialAestheticsModule";
import { LoyaltyModule } from "@/components/clinic/LoyaltyModule";
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
import { CMSBuilder } from "@/components/admin/CMSBuilder";
import { FileGallery } from "@/components/clinic/FileGallery";
import { AdminAppointmentsList } from "./AdminAppointmentsList";
import { MyProfile } from "@/components/dashboard/MyProfile";
import { LocationsManager } from "./LocationsManager";
import { BlogManager } from "./BlogManager";
import { ClinicKanbanBoard } from "@/components/clinic/ClinicKanbanBoard";
import { PatientManager } from "@/components/clinic/PatientManager";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: appointments = [] } = useAppointments();
  const [activeSection, setActiveSection] = useState("dashboard");

  useRealtimeAppointments(true);
  useRealtimeReviews(true);

  // Navigation groups
  const navGroups: NavGroup[] = useMemo(() => [
    {
      title: "Principal",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
        { id: "kanban", label: "Kanban", icon: <ClipboardList className="w-5 h-5" /> },
        { id: "appointments", label: "Citas", icon: <CalendarDays className="w-5 h-5" />, badge: appointments.filter(a => a.status === "pending").length },
        { id: "calendar", label: "Calendario", icon: <Calendar className="w-5 h-5" /> },
        { id: "patients", label: "Pacientes", icon: <Users className="w-5 h-5" /> },
      ]
    },
    {
      title: "Clínica",
      items: [
        { id: "doctors", label: "Doctores", icon: <Stethoscope className="w-5 h-5" /> },
        { id: "orthodontics", label: "Ortodoncia", icon: <Sparkles className="w-5 h-5" /> },
        { id: "aesthetics", label: "Estética Facial", icon: <Smile className="w-5 h-5" /> },
        { id: "lab", label: "Laboratorio", icon: <FlaskConical className="w-5 h-5" /> },
      ]
    },
    {
      title: "Finanzas",
      items: [
        { id: "cash", label: "Caja", icon: <Wallet className="w-5 h-5" /> },
        { id: "invoicing", label: "Facturación", icon: <Receipt className="w-5 h-5" /> },
        { id: "expenses", label: "Gastos", icon: <DollarSign className="w-5 h-5" /> },
        { id: "inventory", label: "Inventario", icon: <Package className="w-5 h-5" /> },
      ]
    },
    {
      title: "Inteligencia Artificial",
      items: [
        { id: "xray", label: "Análisis RX", icon: <Scan className="w-5 h-5" /> },
        { id: "ai-reports", label: "Reportes IA", icon: <Brain className="w-5 h-5" /> },
        { id: "smile", label: "Diseño Sonrisa", icon: <Smile className="w-5 h-5" /> },
      ]
    },
    {
      title: "Comunicación",
      items: [
        { id: "contact-center", label: "Contact Center", icon: <Headphones className="w-5 h-5" /> },
        { id: "chat", label: "Chat Interno", icon: <MessagesSquare className="w-5 h-5" /> },
        { id: "telemedicine", label: "Telemedicina", icon: <Video className="w-5 h-5" /> },
        { id: "reviews", label: "Reseñas", icon: <MessageSquare className="w-5 h-5" /> },
      ]
    },
    {
      title: "Documentos",
      items: [
        { id: "files", label: "Archivos", icon: <FolderOpen className="w-5 h-5" /> },
        { id: "gallery", label: "Galería", icon: <ImageIcon className="w-5 h-5" /> },
        { id: "prescriptions", label: "Recetas", icon: <Pill className="w-5 h-5" /> },
        { id: "templates", label: "Plantillas Doc", icon: <FileStack className="w-5 h-5" /> },
        { id: "template-editor", label: "Editor Plantillas", icon: <FileEdit className="w-5 h-5" /> },
        { id: "signature", label: "Firma Digital", icon: <PenTool className="w-5 h-5" /> },
      ]
    },
    {
      title: "Imagenología",
      items: [
        { id: "dicom", label: "Visor DICOM", icon: <Eye className="w-5 h-5" /> },
        { id: "3d-viewer", label: "Visor 3D", icon: <Box className="w-5 h-5" /> },
      ]
    },
    {
      title: "Marketing",
      items: [
        { id: "referrals", label: "Referidos", icon: <Gift className="w-5 h-5" /> },
        { id: "loyalty", label: "Fidelización", icon: <Gift className="w-5 h-5" /> },
        { id: "blog", label: "Blog", icon: <FileText className="w-5 h-5" /> },
      ]
    },
    {
      title: "Análisis",
      items: [
        { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
        { id: "advanced", label: "Métricas Avanzadas", icon: <TrendingUp className="w-5 h-5" /> },
      ]
    },
    {
      title: "Administración",
      items: [
        { id: "profile", label: "Mi Perfil", icon: <User className="w-5 h-5" /> },
        { id: "locations", label: "Sucursales", icon: <Building2 className="w-5 h-5" /> },
        { id: "profiles", label: "Fotos Perfil", icon: <Camera className="w-5 h-5" /> },
        { id: "qr", label: "QR Pacientes", icon: <QrCode className="w-5 h-5" /> },
        { id: "cms", label: "CMS Builder", icon: <Layout className="w-5 h-5" /> },
        { id: "backup", label: "Backups", icon: <HardDrive className="w-5 h-5" /> },
      ]
    }
  ], [appointments]);

  // Stats calculations
  const stats = useMemo(() => [
    {
      label: "Citas Hoy",
      value: appointments.filter(a => isToday(parseISO(a.appointment_date))).length,
      icon: CalendarDays,
      color: "primary" as const,
      trend: { value: 12, label: "vs ayer" }
    },
    {
      label: "Pendientes",
      value: appointments.filter(a => a.status === "pending").length,
      icon: Clock4,
      color: "warning" as const
    },
    {
      label: "Confirmadas",
      value: appointments.filter(a => a.status === "confirmed").length,
      icon: CheckCircle2,
      color: "success" as const
    },
    {
      label: "Total Citas",
      value: appointments.length,
      icon: Calendar,
      color: "info" as const
    }
  ], [appointments]);

  // Render active section
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <PageHeader 
              title="Dashboard" 
              subtitle={`Bienvenido de vuelta, ${user?.email}`}
            />
            <StatsGrid stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentCard title="Citas Recientes" icon={CalendarDays}>
                <AdminAppointmentsList appointments={appointments.slice(0, 5)} compact />
              </ContentCard>
              <ContentCard title="Analytics Rápido" icon={BarChart3}>
                <AnalyticsDashboard />
              </ContentCard>
            </div>
          </div>
        );
      case "kanban":
        return <ClinicKanbanBoard />;
      case "appointments":
        return <AdminAppointmentsList appointments={appointments} />;
      case "calendar":
        return <AppointmentCalendar appointments={appointments} />;
      case "patients":
        return <PatientManager />;
      case "doctors":
        return <DoctorsManager />;
      case "orthodontics":
        return <OrthodonticsModule patientId="demo-patient" />;
      case "aesthetics":
        return <FacialAestheticsModule />;
      case "lab":
        return <LabOrdersManager />;
      case "cash":
        return <CashRegisterModule />;
      case "invoicing":
        return <InvoicingModule />;
      case "expenses":
        return <ExpensesManager />;
      case "inventory":
        return <InventoryManager />;
      case "xray":
        return <XRayAnalysis />;
      case "ai-reports":
        return <AIReportsModule />;
      case "smile":
        return <SmileSimulator />;
      case "contact-center":
        return <ContactCenterModule />;
      case "chat":
        return <InternalChatModule />;
      case "telemedicine":
        return <TelemedicineModule />;
      case "reviews":
        return <ReviewsManager />;
      case "files":
        return <AdvancedFileManager patientId="demo-patient" />;
      case "gallery":
        return <FileGallery />;
      case "prescriptions":
        return <PrescriptionManager />;
      case "templates":
        return <DocumentTemplates />;
      case "template-editor":
        return <TemplateEditor />;
      case "signature":
        return <DigitalSignature />;
      case "dicom":
        return <DICOMViewer />;
      case "3d-viewer":
        return <Model3DViewer />;
      case "referrals":
        return <ReferralsManager />;
      case "blog":
        return <BlogManager />;
      case "locations":
        return <LocationsManager />;
      case "loyalty":
        return <LoyaltyModule />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "advanced":
        return <AdvancedAnalytics />;
      case "profile":
        return <MyProfile />;
      case "profiles":
        return <ProfilePhotoUpload userId={user?.id || ""} userType="admin" />;
      case "qr":
        return <PatientQRCode patientId="demo-patient" patientName="Paciente Demo" patientEmail="demo@email.com" />;
      case "cms":
        return <CMSBuilder />;
      case "backup":
        return <BackupManager />;
      default:
        return <div className="text-center py-12 text-muted-foreground">Selecciona una sección</div>;
    }
  };

  return (
    <DashboardLayout
      navGroups={navGroups}
      activeItem={activeSection}
      onNavigate={setActiveSection}
      title="Panel de Administración"
      subtitle="NovellDent Sistema Dental"
      userRole="admin"
      notifications={appointments.filter(a => a.status === "pending").length}
    >
      {renderContent()}
    </DashboardLayout>
  );
};
