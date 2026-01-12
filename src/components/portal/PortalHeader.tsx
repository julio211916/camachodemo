import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Users, Wallet, Settings, BarChart3, Heart, Search,
  Video, MessageCircle, HelpCircle, ChevronDown, Bell, Menu, X,
  Building2, Receipt, Package, FileText, Briefcase, TrendingUp,
  PieChart, LineChart, LayoutGrid, UserCheck, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-novelldent.png";

interface PortalHeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  pendingCount?: number;
}

export const PortalHeader = ({ activeSection, onNavigate, pendingCount = 0 }: PortalHeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);

  const mainNavItems = [
    { 
      id: "agenda", 
      label: "Agenda", 
      icon: Calendar,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    { 
      id: "pacientes", 
      label: "Pacientes", 
      icon: Users 
    },
    { 
      id: "cajas", 
      label: "Cajas", 
      icon: Wallet 
    },
    { 
      id: "administracion", 
      label: "Administración", 
      icon: Settings,
      hasDropdown: true,
      dropdownItems: [
        { id: "convenios", label: "Convenios", icon: Briefcase },
        { id: "gastos", label: "Gastos", icon: Receipt },
        { id: "inventario", label: "Inventario", icon: Package },
        { id: "laboratorios", label: "Laboratorios", icon: Building2 },
        { id: "liquidaciones", label: "Liquidaciones", icon: FileText },
        { id: "fusion-fichas", label: "Fusión de fichas", icon: Users },
        { id: "pagos-tpv", label: "Pagos TPV", icon: Wallet },
        { id: "planes-servicios", label: "Planes y servicios", icon: LayoutGrid },
        { type: "separator" },
        { id: "arancel", label: "Arancel de precios", icon: Receipt },
        { id: "bancos", label: "Bancos y entidades", icon: Building2 },
        { id: "documentos-clinicos", label: "Documentos clínicos", icon: FileText },
        { id: "consentimientos", label: "Consentimientos", icon: FileText },
        { id: "logotipo", label: "Logotipo", icon: LayoutGrid },
        { id: "opciones-pago", label: "Opciones de pago", icon: Wallet },
        { id: "pagos-anulados", label: "Pagos anulados", icon: Receipt },
      ]
    },
    { 
      id: "reportes", 
      label: "Reportes", 
      icon: BarChart3,
      hasDropdown: true,
      dropdownItems: [
        { id: "panel-desempeno", label: "Panel de desempeño", icon: TrendingUp },
        { id: "reportes-excel", label: "Reportes Excel", icon: FileText },
        { id: "reportes-graficos", label: "Reportes gráficos", icon: PieChart },
        { type: "separator" },
        { id: "reporte-citas", label: "Reporte de citas", icon: Calendar },
        { id: "reporte-ingresos", label: "Reporte de ingresos", icon: LineChart },
        { id: "reporte-pacientes", label: "Reporte de pacientes", icon: Users },
        { id: "reporte-doctores", label: "Reporte por doctores", icon: UserCheck },
      ]
    },
    { 
      id: "crm", 
      label: "CRM", 
      icon: Heart 
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("pacientes");
      // Could emit search event here
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        {/* Top Bar */}
        <div className="h-10 bg-primary/5 border-b flex items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="NovellDent" className="h-6" />
            <span className="font-serif font-bold text-sm text-primary hidden sm:inline">NovellDent</span>
          </div>

          <div className="flex-1" />

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Patient Search */}
            <form onSubmit={handleSearch} className="relative hidden md:flex">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente..."
                className="w-48 lg:w-64 h-7 pl-8 text-xs"
              />
            </form>

            {/* Video Consultation */}
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 hidden sm:flex">
              <Video className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Videoconsulta</span>
            </Button>

            {/* Support ID */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowSupportChat(true)}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">ID Soporte</span>
            </Button>

            {/* Chat */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-1.5 relative"
              onClick={() => setShowSupportChat(true)}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Chat</span>
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                2
              </Badge>
            </Button>

            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-7 w-7 relative">
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-2 px-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs hidden lg:inline max-w-24 truncate">{profile?.full_name || 'Usuario'}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("mi-perfil")}>
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("configuracion")}>
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="h-12 flex items-center px-4 gap-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => (
              item.hasDropdown ? (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={activeSection.startsWith(item.id) ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.dropdownItems?.map((subItem, idx) => (
                      subItem.type === "separator" ? (
                        <DropdownMenuSeparator key={idx} />
                      ) : (
                        <DropdownMenuItem 
                          key={subItem.id}
                          onClick={() => onNavigate(subItem.id)}
                          className="gap-2"
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4" />}
                          {subItem.label}
                        </DropdownMenuItem>
                      )
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => onNavigate(item.id)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              )
            ))}
          </div>

          <div className="flex-1" />

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-5 h-5" />
          </Button>
        </nav>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="p-3 border-t md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente por nombre/documento..."
                  className="pl-9"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-card"
          >
            <div className="p-2 space-y-1">
              {mainNavItems.map((item) => (
                <div key={item.id}>
                  <Button
                    variant={activeSection === item.id || activeSection.startsWith(item.id) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      if (!item.hasDropdown) {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                    {item.hasDropdown && <ChevronDown className="ml-auto w-4 h-4" />}
                  </Button>
                  
                  {item.hasDropdown && (
                    <div className="pl-8 mt-1 space-y-1">
                      {item.dropdownItems?.filter(i => i.type !== "separator").map((subItem) => (
                        <Button
                          key={subItem.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-muted-foreground"
                          onClick={() => {
                            onNavigate(subItem.id!);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4" />}
                          {subItem.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </header>

      {/* Support Chat Dialog */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Chat de Soporte - Dentoinnovation Group
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">ID de Soporte:</p>
              <code className="text-lg font-mono font-bold text-primary">NDT-{user?.id?.slice(0, 8).toUpperCase() || '00000000'}</code>
            </div>
            <div className="h-48 border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chat en vivo próximamente</p>
                <p className="text-xs">Contacte soporte: soporte@novelldent.com</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortalHeader;
