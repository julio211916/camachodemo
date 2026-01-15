import React, { useState } from 'react';
import { Layout, ConfigProvider, theme as antTheme } from 'antd';
import { UnifiedSidebar } from './UnifiedSidebar';
import { UnifiedHeader } from './UnifiedHeader';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';

// Module imports - All unified
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { useAppointments } from '@/hooks/useAppointments';

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
import { FacialAestheticsModule } from '@/components/clinic/FacialAestheticsModule';
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
import { FileGallery } from '@/components/clinic/FileGallery';
import { PrescriptionManager } from '@/components/clinic/PrescriptionManager';
import { DocumentTemplates } from '@/components/clinic/DocumentTemplates';
import { ClinicalDocumentsEditor } from '@/components/clinic/ClinicalDocumentsEditor';
import { TemplateEditor } from '@/components/clinic/TemplateEditor';
import { DigitalSignature } from '@/components/clinic/DigitalSignature';

// Communication Modules
import { ContactCenterModule } from '@/components/clinic/ContactCenterModule';
import { AppointmentReminderSystem } from '@/components/clinic/AppointmentReminderSystem';
import { InternalChatModule } from '@/components/clinic/InternalChatModule';
import { TelemedicineModule } from '@/components/clinic/TelemedicineModule';

// Admin Modules
import { DoctorsManager } from '@/components/admin/DoctorsManager';
import { ReviewsManager } from '@/components/admin/ReviewsManager';
import { LocationsManager } from '@/components/admin/LocationsManager';
import { ReferralsManager } from '@/components/admin/ReferralsManager';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { CMSBuilder } from '@/components/admin/CMSBuilder';

// Other Modules
import { MyProfile } from '@/components/dashboard/MyProfile';
import { ProfilePhotoUpload } from '@/components/clinic/ProfilePhotoUpload';
import { PatientQRCode } from '@/components/clinic/PatientQRCode';
import { BackupManager } from '@/components/clinic/BackupManager';
import { AIDashboardAssistant } from '@/components/clinic/AIDashboardAssistant';
import { DemoPatientGenerator } from '@/components/clinic/DemoPatientGenerator';
import { LoyaltyModule } from '@/components/clinic/LoyaltyModule';
import { MedicationManager } from '@/components/clinic/MedicationManager';
import { ClinicKanbanBoard } from '@/components/clinic/ClinicKanbanBoard';

const { Content } = Layout;

interface UnifiedDashboardProps {
  userRole: 'admin' | 'staff' | 'doctor' | 'patient';
}

export function UnifiedDashboard({ userRole }: UnifiedDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const { user, profile } = useAuth();
  const { data: appointments = [] } = useAppointments();

  const renderContent = () => {
    switch (activeSection) {
      // Dashboard
      case 'dashboard':
        return (
          <DashboardWidgets
            appointments={appointments}
            userRole={userRole === 'staff' ? 'admin' : userRole}
            userName={profile?.full_name || user?.email}
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
      case 'treatments':
      case 'kanban':
        return <ClinicKanbanBoard />;
      case 'treatment-plan':
        return <TreatmentPlanGenerator />;
      case 'treatment-progress':
        return <TreatmentProgressDashboard />;
      case 'lab':
        return <LabOrdersManager />;
      case 'orthodontics':
        return <OrthodonticsModule patientId="demo-patient" />;
      case 'aesthetics':
        return <FacialAestheticsModule />;

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
      case 'email-marketing':
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
      case 'medications':
        return <MedicationManager />;

      // Documents
      case 'files':
        return <AdvancedFileManager patientId="demo-patient" />;
      case 'gallery':
        return <FileGallery />;
      case 'prescriptions':
        return <PrescriptionManager />;
      case 'templates':
        return <DocumentTemplates />;
      case 'clinical-docs':
        return <ClinicalDocumentsEditor />;
      case 'template-editor':
        return <TemplateEditor />;
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
      case 'reviews':
        return <ReviewsManager />;

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
      case 'demo-patients':
        return <DemoPatientGenerator />;
      case 'ai-assistant':
        return <AIDashboardAssistant onNavigate={setActiveSection} />;

      // Account
      case 'profile':
        return <MyProfile />;
      case 'profiles':
        return <ProfilePhotoUpload userId={user?.id || ''} userType={userRole === 'staff' ? 'admin' : userRole} />;
      case 'qr':
        return <PatientQRCode patientId="demo-patient" patientName="Paciente Demo" patientEmail="demo@email.com" />;

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Selecciona una sección del menú
          </div>
        );
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0d9488',
          borderRadius: 8,
          fontFamily: 'inherit',
        },
      }}
    >
      <BranchProvider>
        <Layout className="min-h-screen">
          <UnifiedSidebar
            activeSection={activeSection}
            onNavigate={setActiveSection}
            collapsed={collapsed}
            onCollapse={setCollapsed}
          />
          <Layout>
            <UnifiedHeader collapsed={collapsed} />
            <Content className="p-6 bg-gray-50 overflow-auto">
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </BranchProvider>
    </ConfigProvider>
  );
}
