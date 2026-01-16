import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EcommerceSidebar } from './EcommerceSidebar';
import { BranchProvider, useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Globe,
  Building2,
  ShoppingCart,
  DollarSign,
  Package,
} from 'lucide-react';

// Admin Modules
import { AdminOrders } from '@/pages/dashboard/admin/AdminOrders';
import { AdminClients } from '@/pages/dashboard/admin/AdminClients';
import { AdminDistributors } from '@/pages/dashboard/admin/AdminDistributors';
import AdminProducts from '@/pages/dashboard/admin/AdminProducts';
import AdminInventory from '@/pages/dashboard/admin/AdminInventory';
import AdminSuppliers from '@/pages/dashboard/admin/AdminSuppliers';
import AdminPurchaseOrders from '@/pages/dashboard/admin/AdminPurchaseOrders';
import { AdminFinance } from '@/pages/dashboard/admin/AdminFinance';
import { AdminEmployees } from '@/pages/dashboard/admin/AdminEmployees';
import { AdminPayroll } from '@/pages/dashboard/admin/AdminPayroll';
import AdminDocuments from '@/pages/dashboard/admin/AdminDocuments';
import AdminReports from '@/pages/dashboard/admin/AdminReports';
import AdminSettings from '@/pages/dashboard/admin/AdminSettings';

// Existing modules
import { CashRegisterModule } from '@/components/clinic/CashRegisterModule';
import { InvoicingModule } from '@/components/clinic/InvoicingModule';
import { ExpensesManager } from '@/components/clinic/ExpensesManager';
import { LocationsManager } from '@/components/admin/LocationsManager';
import { UsersRolesManager } from '@/components/admin/UsersRolesManager';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { DocumentTemplates } from '@/components/clinic/DocumentTemplates';
import { MyProfile } from '@/components/dashboard/MyProfile';

// Customer/Distributor Modules
import CustomerHome from '@/pages/dashboard/customer/CustomerHome';
import CustomerOrders from '@/pages/dashboard/customer/CustomerOrders';
import CustomerFavorites from '@/pages/dashboard/customer/CustomerFavorites';
import CustomerAddresses from '@/pages/dashboard/customer/CustomerAddresses';
import DistributorHome from '@/pages/dashboard/distributor/DistributorHome';
import DistributorOrders from '@/pages/dashboard/distributor/DistributorOrders';
import DistributorHistory from '@/pages/dashboard/distributor/DistributorHistory';
import DistributorAI from '@/pages/dashboard/distributor/DistributorAI';

// Dashboard
import { EcommerceDashboard } from '@/pages/dashboard/admin/EcommerceDashboard';

function EcommerceLayoutContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('ecommerce_sidebar_collapsed') === '1';
  });
  const { user, profile, userRole, signOut } = useAuth();
  const { currentBranch, viewMode } = useBranch();

  useEffect(() => {
    localStorage.setItem('ecommerce_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const renderContent = () => {
    switch (activeSection) {
      // Admin - Dashboard & Operations
      case 'dashboard':
        return <EcommerceDashboard />;
      case 'orders':
        return <AdminOrders />;
      case 'clients':
        return <AdminClients />;
      case 'distributors':
        return <AdminDistributors />;

      // Admin - Inventory
      case 'products':
        return <AdminProducts />;
      case 'inventory':
        return <AdminInventory />;
      case 'suppliers':
        return <AdminSuppliers />;
      case 'purchase-orders':
        return <AdminPurchaseOrders />;

      // Admin - Finance
      case 'finance':
        return <AdminFinance />;
      case 'cash':
        return <CashRegisterModule />;
      case 'invoicing':
        return <InvoicingModule />;
      case 'expenses':
        return <ExpensesManager />;

      // Admin - HR
      case 'employees':
        return <AdminEmployees />;
      case 'payroll':
        return <AdminPayroll />;
      case 'users-roles':
        return <UsersRolesManager />;

      // Admin - Documents
      case 'documents':
        return <AdminDocuments />;
      case 'templates':
        return <DocumentTemplates />;

      // Admin - Reports
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'reports':
        return <AdminReports />;

      // Admin - Settings
      case 'locations':
        return <LocationsManager />;
      case 'settings':
        return <AdminSettings />;

      // Distributor
      case 'distributor-home':
        return <DistributorHome />;
      case 'distributor-orders':
        return <DistributorOrders />;
      case 'distributor-history':
        return <DistributorHistory />;
      case 'distributor-ai':
        return <DistributorAI />;

      // Customer
      case 'customer-home':
        return <CustomerHome />;
      case 'customer-orders':
        return <CustomerOrders />;
      case 'customer-favorites':
        return <CustomerFavorites />;
      case 'customer-addresses':
        return <CustomerAddresses />;

      // Account
      case 'profile':
        return <MyProfile />;

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
      <EcommerceSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between flex-shrink-0">
          {/* Left - Branch/View indicator */}
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
                <ShoppingCart className="w-4 h-4" />
                <span>Pedidos hoy:</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>Pendientes:</span>
                <Badge variant="outline" className="text-amber-600">5</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Ventas:</span>
                <span className="font-medium text-green-600">$24,500</span>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, cliente, pedido..."
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

export function EcommerceLayout() {
  return (
    <BranchProvider>
      <EcommerceLayoutContent />
    </BranchProvider>
  );
}

export default EcommerceLayout;
