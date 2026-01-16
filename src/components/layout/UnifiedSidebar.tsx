import React from 'react';
import { Layout, Menu, Select, Switch, Avatar, Badge, Typography } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  WalletOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  SettingOutlined,
  BankOutlined,
  LineChartOutlined,
  MessageOutlined,
  FundProjectionScreenOutlined,
  FileImageOutlined,
  ContainerOutlined,
  SolutionOutlined,
  DollarOutlined,
  AuditOutlined,
  ScheduleOutlined,
  RocketOutlined,
  GlobalOutlined,
  HomeOutlined,
  BellOutlined,
  SearchOutlined,
  HeartOutlined,
  SmileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import logoNovellDent from '@/assets/logo-novelldent-sidebar.png';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
const { Text, Title } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

interface UnifiedSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

function getMenuItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
  badge?: number
): MenuItem {
  return {
    key,
    icon,
    children,
    label: badge ? (
      <Badge count={badge} size="small" offset={[10, 0]}>
        {label}
      </Badge>
    ) : label,
  } as MenuItem;
}

export function UnifiedSidebar({ activeSection, onNavigate, collapsed, onCollapse }: UnifiedSidebarProps) {
  const { branches, currentBranch, setCurrentBranch, viewMode, setViewMode, canViewGlobal } = useBranch();
  const { profile, userRole, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    // PRINCIPAL
    getMenuItem('Principal', 'principal', <DashboardOutlined />, [
      getMenuItem('Dashboard', 'dashboard', <FundProjectionScreenOutlined />),
      getMenuItem('Notificaciones', 'notifications', <BellOutlined />),
      getMenuItem('Búsqueda Global', 'search', <SearchOutlined />),
    ]),

    // CLÍNICA
    getMenuItem('Clínica', 'clinica', <MedicineBoxOutlined />, [
      getMenuItem('Pacientes', 'patients', <TeamOutlined />),
      getMenuItem('Perfil Paciente', 'patient-profile', <SolutionOutlined />),
      getMenuItem('Odontograma', 'enhanced-odontogram', <SmileOutlined />),
      getMenuItem('Agenda / Citas', 'agenda', <CalendarOutlined />),
      getMenuItem('Tratamientos', 'treatments', <HeartOutlined />),
      getMenuItem('Plan Tratamiento', 'treatment-plan', <FileTextOutlined />),
      getMenuItem('Progreso', 'treatment-progress', <LineChartOutlined />),
      getMenuItem('Laboratorio', 'lab', <ExperimentOutlined />),
      getMenuItem('Ortodoncia', 'orthodontics', <SmileOutlined />),
      getMenuItem('Estética Facial', 'aesthetics', <SmileOutlined />),
    ]),

    // IMAGENOLOGÍA
    getMenuItem('Imagenología', 'imagenologia', <FileImageOutlined />, [
      getMenuItem('Visor 3D Diagnocat', 'dental-3d', <FundProjectionScreenOutlined />),
      getMenuItem('Visor DICOM', 'dicom', <FileImageOutlined />),
      getMenuItem('Análisis RX', 'xray', <FileImageOutlined />),
      getMenuItem('Cefalometría', 'cephalometry', <FileImageOutlined />),
      getMenuItem('Panorámica CBCT', 'cbct-panoramic', <FileImageOutlined />),
      getMenuItem('Diseño Sonrisa', 'smile', <SmileOutlined />),
    ]),

    // CRM
    getMenuItem('CRM', 'crm-section', <RocketOutlined />, [
      getMenuItem('Leads (Pipeline)', 'crm', <RocketOutlined />),
      getMenuItem('Campañas', 'campaigns', <MessageOutlined />),
      getMenuItem('Email Marketing', 'email-marketing', <MessageOutlined />),
      getMenuItem('Referidos', 'referrals', <TeamOutlined />),
      getMenuItem('Fidelización', 'loyalty', <HeartOutlined />),
    ]),

    // FINANZAS
    getMenuItem('Finanzas', 'finanzas', <DollarOutlined />, [
      getMenuItem('Transacciones', 'transactions', <AuditOutlined />),
      getMenuItem('Caja Registradora', 'cash', <WalletOutlined />),
      getMenuItem('Facturación', 'invoicing', <FileTextOutlined />),
      getMenuItem('Gastos', 'expenses', <DollarOutlined />),
      getMenuItem('Inventario', 'inventory', <ContainerOutlined />),
      getMenuItem('Planes de Pago', 'payment-plans', <ScheduleOutlined />),
    ]),

    // PERSONAL
    getMenuItem('Personal', 'personal', <TeamOutlined />, [
      getMenuItem('Doctores', 'doctors', <UserOutlined />),
      getMenuItem('Medicamentos', 'medications', <MedicineBoxOutlined />),
    ]),

    // DOCUMENTOS
    getMenuItem('Documentos', 'documentos', <FileTextOutlined />, [
      getMenuItem('Archivos', 'files', <ContainerOutlined />),
      getMenuItem('Galería', 'gallery', <FileImageOutlined />),
      getMenuItem('Recetas', 'prescriptions', <FileTextOutlined />),
      getMenuItem('Plantillas', 'templates', <FileTextOutlined />),
      getMenuItem('Docs Clínicos', 'clinical-docs', <FileTextOutlined />),
      getMenuItem('Editor Plantillas', 'template-editor', <FileTextOutlined />),
      getMenuItem('Firma Digital', 'signature', <FileTextOutlined />),
    ]),

    // COMUNICACIÓN
    getMenuItem('Comunicación', 'comunicacion', <MessageOutlined />, [
      getMenuItem('Contact Center', 'contact-center', <MessageOutlined />),
      getMenuItem('Recordatorios', 'reminders', <BellOutlined />),
      getMenuItem('Chat Interno', 'chat', <MessageOutlined />),
      getMenuItem('Telemedicina', 'telemedicine', <MessageOutlined />),
      getMenuItem('Reseñas', 'reviews', <MessageOutlined />),
    ]),

    // REPORTES
    getMenuItem('Reportes', 'reportes', <LineChartOutlined />, [
      getMenuItem('Panel Desempeño', 'analytics', <LineChartOutlined />),
      getMenuItem('Métricas Avanzadas', 'advanced', <LineChartOutlined />),
      getMenuItem('Reportes IA', 'ai-reports', <RocketOutlined />),
    ]),

    // CONFIGURACIÓN (Solo Admin)
    ...(userRole === 'admin' || userRole === 'staff' ? [
      getMenuItem('Configuración', 'configuracion', <SettingOutlined />, [
        getMenuItem('Sucursales', 'locations', <BankOutlined />),
        getMenuItem('Administración', 'administration', <SettingOutlined />),
        getMenuItem('CMS Builder', 'cms', <SettingOutlined />),
        getMenuItem('Backups', 'backup', <SettingOutlined />),
        getMenuItem('Pacientes Demo', 'demo-patients', <TeamOutlined />),
        getMenuItem('Asistente IA', 'ai-assistant', <RocketOutlined />),
      ]),
    ] : []),

    // MI CUENTA
    getMenuItem('Mi Cuenta', 'cuenta', <UserOutlined />, [
      getMenuItem('Mi Perfil', 'profile', <UserOutlined />),
      getMenuItem('Foto Perfil', 'profiles', <FileImageOutlined />),
      getMenuItem('QR Pacientes', 'qr', <FileImageOutlined />),
    ]),
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    onNavigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      theme="light"
      className="h-screen overflow-hidden border-r border-gray-200"
      trigger={null}
    >
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src={logoNovellDent} 
              alt="NovellDent" 
              className={`transition-all duration-300 ${collapsed ? 'w-10 h-10' : 'w-12 h-12'} object-contain`}
            />
            {!collapsed && (
              <div>
                <Title level={5} className="!mb-0 !text-teal-700">NovellDent</Title>
                <Text type="secondary" className="text-xs">Sistema Dental</Text>
              </div>
            )}
          </div>
        </div>

        {/* Branch Selector */}
        {!collapsed && (
          <div className="p-3 border-b border-gray-100 space-y-2">
            {/* View Mode Toggle */}
            {canViewGlobal && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  {viewMode === 'global' ? (
                    <GlobalOutlined className="text-teal-600" />
                  ) : (
                    <HomeOutlined className="text-blue-600" />
                  )}
                  <Text className="text-xs font-medium">
                    {viewMode === 'global' ? 'Vista Global' : 'Vista Local'}
                  </Text>
                </div>
                <Switch
                  size="small"
                  checked={viewMode === 'global'}
                  onChange={(checked) => setViewMode(checked ? 'global' : 'local')}
                  className={viewMode === 'global' ? 'bg-teal-500' : ''}
                />
              </div>
            )}

            {/* Branch Selector */}
            {viewMode === 'local' && (
              <Select
                value={currentBranch?.id}
                onChange={(value) => {
                  const branch = branches.find(b => b.id === value);
                  if (branch) setCurrentBranch(branch);
                }}
                options={branches.map(b => ({ label: b.name, value: b.id }))}
                className="w-full"
                placeholder="Seleccionar sucursal"
                size="small"
              />
            )}
          </div>
        )}

        {/* Collapse Button */}
        <div className="p-2 border-b border-gray-100">
          <button
            onClick={() => onCollapse(!collapsed)}
            className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[activeSection]}
            onClick={handleMenuClick}
            items={menuItems}
            className="border-0"
          />
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar 
              size={collapsed ? 32 : 40}
              src={profile?.avatar_url}
              icon={<UserOutlined />}
              className="bg-teal-500"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <Text strong className="block truncate text-sm">
                  {profile?.full_name || 'Usuario'}
                </Text>
                <Text type="secondary" className="text-xs">
                  {userRole === 'admin' ? 'Admin Master' : 
                   userRole === 'staff' ? 'Staff' :
                   userRole === 'doctor' ? 'Doctor' : 'Paciente'}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sider>
  );
}
