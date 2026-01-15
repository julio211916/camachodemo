import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  FileText,
  Settings,
  Building2,
  UserCog,
  Package,
  MessageSquare,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Home,
  LogOut,
  Moon,
  Sun,
  Smile,
  Stethoscope,
  Brain,
  ImageIcon,
  FlaskConical,
  Receipt,
  Shield,
  Database,
  Heart,
  Mail,
  Bell,
  CreditCard,
  Briefcase,
  FileSignature,
  FolderOpen,
  Target,
  Megaphone,
} from 'lucide-react';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: SidebarItem[];
  roles: UserRole[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: UserRole[];
}

interface RoleSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

// Sidebar sections by role
const sidebarSections: SidebarSection[] = [
  // OPERACIÓN
  {
    id: 'operacion',
    title: 'Operación',
    icon: LayoutDashboard,
    roles: ['admin', 'staff', 'doctor'],
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'agenda', label: 'Agenda & Citas', icon: Calendar },
      { id: 'patients', label: 'Pacientes', icon: Users },
      { id: 'transactions', label: 'Finanzas', icon: Wallet },
      { id: 'contact-center', label: 'Comunicación', icon: MessageSquare },
      { id: 'analytics', label: 'Reportes', icon: BarChart3 },
    ],
  },
  // MI PRÁCTICA (Doctor only)
  {
    id: 'mi-practica',
    title: 'Mi Práctica',
    icon: Stethoscope,
    roles: ['doctor'],
    items: [
      { id: 'dashboard', label: 'Mi Dashboard', icon: LayoutDashboard },
      { id: 'agenda', label: 'Mi Agenda', icon: Calendar },
      { id: 'patients', label: 'Mis Pacientes', icon: Users },
      { id: 'enhanced-odontogram', label: 'Atención Clínica', icon: Smile },
      { id: 'ai-reports', label: 'IA Clínica', icon: Brain },
    ],
  },
  // CLÍNICA
  {
    id: 'clinica',
    title: 'Clínica',
    icon: Stethoscope,
    roles: ['admin', 'staff'],
    items: [
      { id: 'patient-profile', label: 'Ficha Clínica', icon: Users },
      { id: 'enhanced-odontogram', label: 'Odontograma', icon: Smile },
      { id: 'treatment-plan', label: 'Plan Tratamiento', icon: FileText },
      { id: 'treatment-progress', label: 'Progreso', icon: BarChart3 },
      { id: 'lab', label: 'Laboratorio', icon: FlaskConical },
      { id: 'orthodontics', label: 'Ortodoncia', icon: Smile },
    ],
  },
  // IMAGENOLOGÍA
  {
    id: 'imagenologia',
    title: 'Imagenología',
    icon: ImageIcon,
    roles: ['admin', 'staff', 'doctor'],
    items: [
      { id: 'dental-3d', label: 'Visor 3D', icon: ImageIcon },
      { id: 'dicom', label: 'DICOM', icon: ImageIcon },
      { id: 'xray', label: 'Análisis RX', icon: ImageIcon },
      { id: 'cephalometry', label: 'Cefalometría', icon: ImageIcon },
      { id: 'smile', label: 'Diseño Sonrisa', icon: Smile },
    ],
  },
  // CRM
  {
    id: 'crm',
    title: 'CRM',
    icon: Target,
    roles: ['admin', 'staff'],
    items: [
      { id: 'crm', label: 'Leads (Pipeline)', icon: Target },
      { id: 'campaigns', label: 'Campañas', icon: Megaphone },
      { id: 'referrals', label: 'Referidos', icon: Users },
      { id: 'loyalty', label: 'Fidelización', icon: Heart },
    ],
  },
  // FINANZAS
  {
    id: 'finanzas',
    title: 'Finanzas',
    icon: Wallet,
    roles: ['admin', 'staff'],
    items: [
      { id: 'transactions', label: 'Transacciones', icon: Receipt },
      { id: 'cash', label: 'Caja', icon: CreditCard },
      { id: 'invoicing', label: 'Facturación', icon: FileText },
      { id: 'expenses', label: 'Gastos', icon: Wallet },
      { id: 'inventory', label: 'Inventario', icon: Package },
      { id: 'payment-plans', label: 'Planes Pago', icon: CreditCard },
    ],
  },
  // PERSONAL
  {
    id: 'personal',
    title: 'Personal',
    icon: UserCog,
    roles: ['admin'],
    items: [
      { id: 'doctors', label: 'Profesionales', icon: UserCog },
      { id: 'medications', label: 'Medicamentos', icon: FlaskConical },
    ],
  },
  // DOCUMENTOS
  {
    id: 'documentos',
    title: 'Documentos',
    icon: FileText,
    roles: ['admin', 'staff', 'doctor'],
    items: [
      { id: 'files', label: 'Archivos', icon: FolderOpen },
      { id: 'templates', label: 'Plantillas', icon: FileText },
      { id: 'prescriptions', label: 'Recetas', icon: FileText },
      { id: 'signature', label: 'Firma Digital', icon: FileSignature },
    ],
  },
  // COMUNICACIÓN
  {
    id: 'comunicacion',
    title: 'Comunicación',
    icon: MessageSquare,
    roles: ['admin', 'staff'],
    items: [
      { id: 'contact-center', label: 'Contact Center', icon: MessageSquare },
      { id: 'reminders', label: 'Recordatorios', icon: Bell },
      { id: 'chat', label: 'Chat Interno', icon: MessageSquare },
      { id: 'telemedicine', label: 'Telemedicina', icon: MessageSquare },
    ],
  },
  // REPORTES
  {
    id: 'reportes',
    title: 'Reportes & IA',
    icon: BarChart3,
    roles: ['admin', 'staff'],
    items: [
      { id: 'analytics', label: 'Panel Desempeño', icon: BarChart3 },
      { id: 'advanced', label: 'Métricas Avanzadas', icon: BarChart3 },
      { id: 'ai-reports', label: 'Reportes IA', icon: Brain },
    ],
  },
  // ORGANIZACIÓN (Admin Master only)
  {
    id: 'organizacion',
    title: 'Organización',
    icon: Building2,
    roles: ['admin'],
    items: [
      { id: 'locations', label: 'Sucursales', icon: Building2 },
      { id: 'doctors', label: 'Profesionales & Roles', icon: UserCog },
      { id: 'administration', label: 'Catálogos', icon: Package },
      { id: 'templates', label: 'Plantillas & Docs', icon: FileText },
      { id: 'backup', label: 'Seguridad & Backups', icon: Shield },
      { id: 'cms', label: 'Integraciones', icon: Database },
    ],
  },
  // MI CUENTA
  {
    id: 'cuenta',
    title: 'Mi Cuenta',
    icon: Settings,
    roles: ['admin', 'staff', 'doctor', 'patient'],
    items: [
      { id: 'profile', label: 'Mi Perfil', icon: Users },
      { id: 'profiles', label: 'Foto Perfil', icon: ImageIcon },
    ],
  },
];

export function RoleSidebar({ activeSection, onNavigate, collapsed, onCollapse }: RoleSidebarProps) {
  const { branches, currentBranch, setCurrentBranch, viewMode, setViewMode, canViewGlobal } = useBranch();
  const { profile, userRole, signOut, isAdminMaster } = useAuth();
  const [openSections, setOpenSections] = useState<string[]>(['operacion', 'mi-practica']);
  const [darkMode, setDarkMode] = useState(false);

  // Get role-specific label
  const getRoleLabel = () => {
    if (isAdminMaster) return 'Admin Master';
    switch (userRole) {
      case 'admin': return 'Admin Sucursal';
      case 'staff': return 'Staff';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return 'Usuario';
    }
  };

  const getRoleBadgeColor = () => {
    if (isAdminMaster) return 'bg-gradient-to-r from-primary to-purple-500';
    switch (userRole) {
      case 'admin': return 'bg-blue-500';
      case 'staff': return 'bg-green-500';
      case 'doctor': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter sections by role
  const filteredSections = sidebarSections.filter(section => {
    // For doctor role, only show "Mi Práctica" as primary, not "Operación"
    if (userRole === 'doctor' && section.id === 'operacion') return false;
    // "Organización" section only for Admin Master
    if (section.id === 'organizacion' && !isAdminMaster) return false;
    return section.roles.includes(userRole as UserRole);
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className={cn(
      "h-screen flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
            <Smile className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground truncate">NovellDent</h1>
              <p className="text-xs text-muted-foreground truncate">Sistema Dental</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => onCollapse(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile?.full_name || 'Usuario'}</p>
              <Badge className={cn("text-[10px] text-white", getRoleBadgeColor())}>
                {getRoleLabel()}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Branch Selector */}
      {!collapsed && (
        <div className="p-3 border-b border-border space-y-2">
          {/* View Mode Toggle (Only for Admin Master) */}
          {canViewGlobal && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                {viewMode === 'global' ? (
                  <Globe className="w-4 h-4 text-primary" />
                ) : (
                  <Home className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-xs font-medium">
                  {viewMode === 'global' ? 'Vista Global' : 'Vista Local'}
                </span>
              </div>
              <Switch
                checked={viewMode === 'global'}
                onCheckedChange={(checked) => setViewMode(checked ? 'global' : 'local')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          )}

          {/* Branch Selector (Only in Local Mode) */}
          {viewMode === 'local' && branches.length > 0 && (
            <Select
              value={currentBranch?.id || ''}
              onValueChange={(value) => {
                const branch = branches.find(b => b.id === value);
                if (branch) setCurrentBranch(branch);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <Building2 className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {filteredSections.map((section) => (
            <Collapsible
              key={section.id}
              open={collapsed ? false : openSections.includes(section.id)}
              onOpenChange={() => !collapsed && toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-sm font-medium",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{section.title}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        openSections.includes(section.id) && "rotate-180"
                      )} />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              {!collapsed && (
                <CollapsibleContent className="space-y-1 pl-4 mt-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 h-8 text-xs",
                        activeSection === item.id && "bg-primary/10 text-primary font-medium"
                      )}
                      onClick={() => onNavigate(item.id)}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </CollapsibleContent>
              )}
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full gap-2", collapsed ? "justify-center" : "justify-start")}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Modo {darkMode ? 'claro' : 'oscuro'}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed ? "justify-center" : "justify-start"
          )}
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-xs">Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  );
}

export default RoleSidebar;
