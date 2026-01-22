import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
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
import { useThemePreference } from '@/hooks/useThemePreference';
import logoCamachoIcon from '@/assets/logo-camacho.jpg';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  FileText,
  Settings,
  Building2,
  UserCog,
  Package,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Home,
  LogOut,
  Moon,
  Sun,
  Truck,
  Brain,
  Receipt,
  Shield,
  Heart,
  MapPin,
  History,
  CreditCard,
  DollarSign,
  ClipboardList,
  Boxes,
  Factory,
  Calculator,
  Menu,
  X,
} from 'lucide-react';

import { UserRole } from '@/hooks/useAuth';

type NonNullUserRole = Exclude<UserRole, null>;

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: SidebarItem[];
  roles: NonNullUserRole[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: NonNullUserRole[];
}

interface EcommerceSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

// Sidebar sections by role - E-commerce focused
const sidebarSections: SidebarSection[] = [
  // ADMIN - Dashboard & Operations
  {
    id: 'operaciones',
    title: 'Operaciones',
    icon: LayoutDashboard,
    roles: ['admin', 'staff'],
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'distributors', label: 'Distribuidores', icon: Truck },
    ],
  },
  // ADMIN - Inventory & Products
  {
    id: 'inventario',
    title: 'Inventario',
    icon: Package,
    roles: ['admin', 'staff'],
    items: [
      { id: 'products', label: 'Productos', icon: Package },
      { id: 'inventory', label: 'Stock', icon: Boxes },
      { id: 'suppliers', label: 'Proveedores', icon: Factory },
      { id: 'purchase-orders', label: 'Órdenes Compra', icon: ClipboardList },
    ],
  },
  // ADMIN - Finance
  {
    id: 'finanzas',
    title: 'Finanzas',
    icon: Wallet,
    roles: ['admin'],
    items: [
      { id: 'finance', label: 'Balance General', icon: DollarSign },
      { id: 'cash', label: 'Caja', icon: CreditCard },
      { id: 'invoicing', label: 'Facturación', icon: Receipt },
      { id: 'expenses', label: 'Gastos', icon: Wallet },
    ],
  },
  // ADMIN - HR & Payroll
  {
    id: 'personal',
    title: 'Personal',
    icon: UserCog,
    roles: ['admin'],
    items: [
      { id: 'employees', label: 'Empleados', icon: Users },
      { id: 'payroll', label: 'Nómina', icon: Calculator },
      { id: 'users-roles', label: 'Usuarios & Roles', icon: Shield },
    ],
  },
  // ADMIN - Documents
  {
    id: 'documentos',
    title: 'Documentos',
    icon: FileText,
    roles: ['admin', 'staff'],
    items: [
      { id: 'documents', label: 'Notas & Tickets', icon: FileText },
      { id: 'templates', label: 'Plantillas', icon: FileText },
    ],
  },
  // ADMIN - Reports
  {
    id: 'reportes',
    title: 'Reportes',
    icon: BarChart3,
    roles: ['admin', 'staff'],
    items: [
      { id: 'analytics', label: 'Analítica', icon: BarChart3 },
      { id: 'reports', label: 'Reportes', icon: FileText },
    ],
  },
  // ADMIN - Settings
  {
    id: 'configuracion',
    title: 'Configuración',
    icon: Settings,
    roles: ['admin'],
    items: [
      { id: 'locations', label: 'Sucursales', icon: Building2 },
      { id: 'settings', label: 'Ajustes', icon: Settings },
    ],
  },
  // VENDOR - Physical Sales
  {
    id: 'vendedor',
    title: 'Vendedor',
    icon: Truck,
    roles: ['vendor'],
    items: [
      { id: 'vendor-home', label: 'Mi Panel', icon: Home },
      { id: 'vendor-pos', label: 'Punto de Venta', icon: CreditCard },
      { id: 'vendor-orders', label: 'Mis Ventas', icon: ShoppingCart },
      { id: 'vendor-clients', label: 'Mis Clientes', icon: Users },
      { id: 'vendor-route', label: 'Mi Ruta', icon: MapPin },
      { id: 'vendor-stock', label: 'Mi Inventario', icon: Package },
    ],
  },
  // DISTRIBUTOR - Main
  {
    id: 'distribuidor',
    title: 'Mi Portal',
    icon: Home,
    roles: ['distributor'],
    items: [
      { id: 'distributor-home', label: 'Inicio', icon: Home },
      { id: 'distributor-catalog', label: 'Catálogo Lab', icon: Package },
      { id: 'distributor-orders', label: 'Mis Pedidos', icon: ShoppingCart },
      { id: 'distributor-inventory', label: 'Mi Inventario', icon: Boxes },
      { id: 'distributor-clients', label: 'Mis Clientes', icon: Users },
      { id: 'distributor-vendors', label: 'Mis Vendedores', icon: Truck },
      { id: 'distributor-history', label: 'Historial', icon: History },
      { id: 'distributor-ai', label: 'Asistente IA', icon: Brain },
    ],
  },
  // CUSTOMER - Main
  {
    id: 'cliente',
    title: 'Mi Cuenta',
    icon: Home,
    roles: ['customer'],
    items: [
      { id: 'customer-home', label: 'Inicio', icon: Home },
      { id: 'customer-orders', label: 'Mis Pedidos', icon: ShoppingCart },
      { id: 'customer-favorites', label: 'Favoritos', icon: Heart },
      { id: 'customer-addresses', label: 'Direcciones', icon: MapPin },
    ],
  },
  // Account for all
  {
    id: 'cuenta',
    title: 'Mi Cuenta',
    icon: Settings,
    roles: ['admin', 'staff', 'distributor', 'customer', 'vendor'],
    items: [
      { id: 'profile', label: 'Mi Perfil', icon: Users },
    ],
  },
];

export function EcommerceSidebar({ activeSection, onNavigate, collapsed, onCollapse }: EcommerceSidebarProps) {
  const { branches, currentBranch, setCurrentBranch, viewMode, setViewMode, canViewGlobal } = useBranch();
  const { profile, userRole, signOut, isAdminMaster } = useAuth();
  const { isDark, toggleTheme } = useThemePreference();
  const [openSections, setOpenSections] = useState<string[]>(['operaciones', 'distribuidor', 'cliente']);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeSection]);

  const getRoleLabel = () => {
    if (isAdminMaster) return 'Admin Master';
    switch (userRole) {
      case 'admin': return 'Administrador';
      case 'staff': return 'Staff';
      case 'vendor': return 'Vendedor';
      case 'distributor': return 'Distribuidor';
      case 'customer': return 'Cliente';
      default: return 'Usuario';
    }
  };

  const getRoleBadgeColor = () => {
    if (isAdminMaster) return 'bg-gradient-to-r from-primary to-purple-500';
    switch (userRole) {
      case 'admin': return 'bg-blue-500';
      case 'staff': return 'bg-emerald-500';
      case 'vendor': return 'bg-green-500';
      case 'distributor': return 'bg-orange-500';
      case 'customer': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  // Map userRole to ecommerce roles
  const ecommerceRole = (): NonNullUserRole | null => {
    if (userRole === 'doctor') return 'customer';
    if (userRole === 'patient') return 'customer';
    return userRole;
  };

  const filteredSections = sidebarSections.filter(section => {
    const role = ecommerceRole();
    return role ? section.roles.includes(role) : false;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  useEffect(() => {
    const activeItemSection = filteredSections.find(section =>
      section.items.some(item => item.id === activeSection)
    );
    if (activeItemSection && !openSections.includes(activeItemSection.id)) {
      setOpenSections(prev => [...prev, activeItemSection.id]);
    }
  }, [activeSection, filteredSections]);

  const SidebarContent = () => (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "h-screen flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-3 border-b border-border flex-shrink-0">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={logoCamachoIcon}
                alt="Productos Camacho"
                className="w-8 h-8 object-cover rounded"
                loading="eager"
              />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-foreground truncate">Productos Camacho</h1>
                <p className="text-xs text-muted-foreground truncate">Sistema E-commerce</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className={cn("p-2 border-b border-border flex-shrink-0", collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => onCollapse(!collapsed)}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expandir menú' : 'Colapsar menú'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-3 border-b border-border flex-shrink-0">
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

        {/* Branch Selector - Admin only */}
        {!collapsed && (userRole === 'admin' || userRole === 'staff') && (
          <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
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
        <ScrollArea className="flex-1 min-h-0">
          <LayoutGroup id="ecommerce-sidebar">
            <nav className="p-2 space-y-1">
              {filteredSections.map((section) => (
                <Collapsible
                  key={section.id}
                  open={collapsed ? false : openSections.includes(section.id)}
                  onOpenChange={() => !collapsed && toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" className="w-full justify-center px-2">
                            <section.icon className="w-4 h-4 flex-shrink-0" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{section.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button variant="ghost" className="w-full justify-start gap-2 text-sm font-medium">
                        <section.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{section.title}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            openSections.includes(section.id) && 'rotate-180'
                          )}
                        />
                      </Button>
                    )}
                  </CollapsibleTrigger>

                  {!collapsed && (
                    <CollapsibleContent className="space-y-1 pl-4 mt-1">
                      {section.items.map((item) => {
                        const isActive = activeSection === item.id;

                        return (
                          <div key={item.id} className="relative">
                            {isActive && (
                              <motion.div
                                layoutId="ecommerce-sidebar-active"
                                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                className="absolute inset-0 rounded-md bg-primary/10"
                              />
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'relative z-10 w-full justify-start gap-2 h-8 text-xs transition-colors',
                                isActive && 'text-primary font-medium'
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
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              ))}
            </nav>
          </LayoutGroup>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border flex-shrink-0 space-y-2">
          {/* Theme Toggle */}
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && <span className="text-xs text-muted-foreground">Tema</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "h-8 w-8")}
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Cerrar Sesión</TooltipContent>}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full z-50 transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>
    </>
  );
}

export default EcommerceSidebar;
