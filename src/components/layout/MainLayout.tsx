import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleSidebar } from './RoleSidebar';
import { ResponsiveDashboard } from './ResponsiveDashboard';
import { BranchProvider, useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Globe,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
} from 'lucide-react';

// Portal Modules
import { AgendaModule } from '@/components/portal/AgendaModule';
import { CRMModule } from '@/components/portal/CRMModule';
import { CajasModule } from '@/components/portal/CajasModule';
import { AdministrationModule } from '@/components/portal/AdministrationModule';

// Clinical Modules
import { PatientManager } from '@/components/clinic/PatientManager';
import { ComprehensivePatientProfile } from '@/components/clinic/ComprehensivePatientProfile';
import { EnhancedOdontogram } from '@/components/clinic/EnhancedOdontogram';
import { DiagnocatViewer } from '@/components/clinic/DiagnocatViewer';
import { OrthodonticsModule } from '@/components/clinic/OrthodonticsModule';
import { LabOrdersManager } from '@/components/clinic/LabOrdersManager';
import { TreatmentPlanGenerator } from '@/components/clinic/TreatmentPlanGenerator';
import { TreatmentProgressDashboard } from '@/components/clinic/TreatmentProgressDashboard';

// Finance Modules
import { CashRegisterModule } from '@/components/clinic/CashRegisterModule';
import { InvoicingModule } from '@/components/clinic/InvoicingModule';
import { ExpensesManager } from '@/components/clinic/ExpensesManager';
import { InventoryManager } from '@/components/clinic/InventoryManager';
import { PaymentPlanCalculator } from '@/components/clinic/PaymentPlanCalculator';

// Imaging Modules
import { DICOMViewer } from '@/components/clinic/DICOMViewer';
import { XRayAnalysis } from '@/components/clinic/XRayAnalysis';
import { CephalometryModule } from '@/components/clinic/CephalometryModule';
import { CBCTPanoramicGenerator } from '@/components/clinic/CBCTPanoramicGenerator';
import { SmileSimulator } from '@/components/clinic/SmileSimulator';
import { AIReportsModule } from '@/components/clinic/AIReportsModule';

// Document Modules
import { AdvancedFileManager } from '@/components/clinic/AdvancedFileManager';
import { PrescriptionManager } from '@/components/clinic/PrescriptionManager';
import { DocumentTemplates } from '@/components/clinic/DocumentTemplates';
import { DigitalSignature } from '@/components/clinic/DigitalSignature';

// Communication Modules
import { ContactCenterModule } from '@/components/clinic/ContactCenterModule';
import { AppointmentReminderSystem } from '@/components/clinic/AppointmentReminderSystem';
import { InternalChatModule } from '@/components/clinic/InternalChatModule';
import { TelemedicineModule } from '@/components/clinic/TelemedicineModule';

// Admin Modules
import { DoctorsManager } from '@/components/admin/DoctorsManager';
import { LocationsManager } from '@/components/admin/LocationsManager';
import { ReferralsManager } from '@/components/admin/ReferralsManager';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { CMSBuilder } from '@/components/admin/CMSBuilder';

// Other Modules
import { MyProfile } from '@/components/dashboard/MyProfile';
import { ProfilePhotoUpload } from '@/components/clinic/ProfilePhotoUpload';
import { BackupManager } from '@/components/clinic/BackupManager';
import { LoyaltyModule } from '@/components/clinic/LoyaltyModule';

function MainLayoutContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('portal_sidebar_collapsed') === '1';
  });
  const { user, profile, userRole, signOut } = useAuth();
  const { currentBranch, viewMode, branchSummaries } = useBranch();
  const { data: appointments = [] } = useAppointments();

  useEffect(() => {
    localStorage.setItem('portal_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // Calculate summary stats
  const summary = viewMode === 'global'
    ? branchSummaries.reduce((acc, s) => ({
        total_appointments_today: acc.total_appointments_today + s.total_appointments_today,
        pending_appointments: acc.pending_appointments + s.pending_appointments,
        income_today: acc.income_today + s.income_today,
        expenses_today: acc.expenses_today + s.expenses_today,
      }), { total_appointments_today: 0, pending_appointments: 0, income_today: 0, expenses_today: 0 })
    : branchSummaries.find(s => s.location_id === currentBranch?.id) || {
        total_appointments_today: 0,
        pending_appointments: 0,
        income_today: 0,
        expenses_today: 0,
      };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <ResponsiveDashboard
            appointments={appointments}
            userRole={userRole as any}
            userName={profile?.full_name}
            branchName={currentBranch?.name}
            isGlobal={viewMode === 'global'}
          />
        );

      // Clinical
      case 'agenda':
        return <AgendaModule />;
      case 'patients':
        return <PatientManager />;
      case 'patient-profile':
        return <ComprehensivePatientProfile patientId="demo-patient" />;
      case 'enhanced-odontogram':
        return <EnhancedOdontogram patientId="demo-patient" />;
      case 'treatment-plan':
        return <TreatmentPlanGenerator />;
      case 'treatment-progress':
        return <TreatmentProgressDashboard />;
      case 'lab':
        return <LabOrdersManager />;
      case 'orthodontics':
        return <OrthodonticsModule patientId="demo-patient" />;

      // Imaging
      case 'dental-3d':
        return <DiagnocatViewer patientId="demo-patient" patientName="Paciente Demo" />;
      case 'dicom':
        return <DICOMViewer />;
      case 'xray':
        return <XRayAnalysis />;
      case 'cephalometry':
        return <CephalometryModule />;
      case 'cbct-panoramic':
        return <CBCTPanoramicGenerator patientId="demo" patientName="Paciente Demo" />;
      case 'smile':
        return <SmileSimulator />;
      case 'ai-reports':
        return <AIReportsModule />;

      // CRM
      case 'crm':
      case 'campaigns':
        return <CRMModule />;
      case 'referrals':
        return <ReferralsManager />;
      case 'loyalty':
        return <LoyaltyModule />;

      // Finance
      case 'transactions':
      case 'cajas':
        return <CajasModule />;
      case 'cash':
        return <CashRegisterModule />;
      case 'invoicing':
        return <InvoicingModule />;
      case 'expenses':
        return <ExpensesManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'payment-plans':
        return <PaymentPlanCalculator treatmentTotal={10000} />;

      // Personnel
      case 'doctors':
        return <DoctorsManager />;

      // Documents
      case 'files':
        return <AdvancedFileManager patientId="demo-patient" />;
      case 'templates':
        return <DocumentTemplates />;
      case 'prescriptions':
        return <PrescriptionManager />;
      case 'signature':
        return <DigitalSignature />;

      // Communication
      case 'contact-center':
        return <ContactCenterModule />;
      case 'reminders':
        return <AppointmentReminderSystem />;
      case 'chat':
        return <InternalChatModule />;
      case 'telemedicine':
        return <TelemedicineModule />;

      // Reports
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'advanced':
        return <AdvancedAnalytics />;

      // Configuration
      case 'locations':
        return <LocationsManager />;
      case 'administration':
        return <AdministrationModule />;
      case 'cms':
        return <CMSBuilder />;
      case 'backup':
        return <BackupManager />;

      // Account
      case 'profile':
        return <MyProfile />;
      case 'profiles':
        return <ProfilePhotoUpload userId={user?.id || ''} userType={userRole === 'staff' ? 'admin' : userRole} />;

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Selecciona una sección del menú</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <RoleSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between flex-shrink-0">
          {/* Left - Branch/View indicator + Stats */}
          <div className="flex items-center gap-4">
            <Badge variant={viewMode === 'global' ? 'default' : 'secondary'} className="gap-1">
              {viewMode === 'global' ? (
                <><Globe className="w-3 h-3" /> Vista Global</>
              ) : (
                <><Building2 className="w-3 h-3" /> {currentBranch?.name || 'Sucursal'}</>
              )}
            </Badge>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>Citas hoy:</span>
                <Badge variant="outline">{summary.total_appointments_today}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Pendientes:</span>
                <Badge variant="outline" className="text-amber-600">{summary.pending_appointments}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Ingresos:</span>
                <span className="font-medium text-green-600">${(summary.income_today || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente, cita, factura..."
                className="pl-9 h-9 bg-muted/50"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium">
                    {profile?.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setActiveSection('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export function MainLayout() {
  return (
    <BranchProvider>
      <MainLayoutContent />
    </BranchProvider>
  );
}

export default MainLayout;
