import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  X,
  User,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import logo from "@/assets/logo-novelldent.png";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  activeItem: string;
  onNavigate: (id: string) => void;
  title: string;
  subtitle?: string;
  userRole: "admin" | "doctor" | "patient" | "staff";
  showSearch?: boolean;
  notifications?: number;
}

export const DashboardLayout = ({
  children,
  navGroups,
  activeItem,
  onNavigate,
  title,
  subtitle,
  userRole,
  showSearch = true,
  notifications = 0
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Auto-expand group containing active item
  useEffect(() => {
    navGroups.forEach(group => {
      if (group.items.some(item => item.id === activeItem)) {
        if (!expandedGroups.includes(group.title)) {
          setExpandedGroups(prev => [...prev, group.title]);
        }
      }
    });
  }, [activeItem, navGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "admin": return "Administrador";
      case "doctor": return "Doctor";
      case "patient": return "Paciente";
      case "staff": return "Personal";
      default: return "Usuario";
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case "admin": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "doctor": return "bg-primary/10 text-primary border-primary/30";
      case "patient": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "staff": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex dashboard-theme">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 280 }}
          className={cn(
            "fixed top-0 left-0 h-screen z-50 bg-sidebar-background border-r border-sidebar-border",
            "flex flex-col transition-all duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo Section */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed && (
              <div className="flex items-center gap-3">
                <img src={logo} alt="NovellDent" className="h-8" />
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-sidebar-foreground text-sm">
                    NovellDent
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/60">
                    Sistema Dental
                  </span>
                </div>
              </div>
            )}
            {collapsed && (
              <img src={logo} alt="NovellDent" className="h-8" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-sidebar-foreground/60"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className={cn(
            "p-4 border-b border-sidebar-border",
            collapsed && "flex justify-center"
          )}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 border-2 border-primary/30 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{profile?.full_name || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-primary/30">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || "Usuario"}
                  </p>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getRoleColor())}>
                    {getRoleLabel()}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {navGroups.map((group) => (
                <div key={group.title}>
                  {!collapsed && (
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="flex items-center justify-between w-full text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2 hover:text-sidebar-foreground/70 transition-colors"
                    >
                      {group.title}
                      <ChevronRight className={cn(
                        "h-3 w-3 transition-transform",
                        expandedGroups.includes(group.title) && "rotate-90"
                      )} />
                    </button>
                  )}
                  <AnimatePresence initial={false}>
                    {(collapsed || expandedGroups.includes(group.title)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1 overflow-hidden"
                      >
                        {group.items.map((item) => {
                          const isActive = activeItem === item.id;
                          
                          return collapsed ? (
                            <Tooltip key={item.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    onNavigate(item.id);
                                    setMobileOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-center h-10 rounded-lg transition-all relative",
                                    isActive
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  )}
                                >
                                  <div className="w-5 h-5">{item.icon}</div>
                                  {item.badge && item.badge > 0 && (
                                    <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <button
                              key={item.id}
                              onClick={() => {
                                onNavigate(item.id);
                                setMobileOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                              )}
                            >
                              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
                              <span className="truncate">{item.label}</span>
                              {item.badge && item.badge > 0 && (
                                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5">
                                  {item.badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-sidebar-border space-y-1">
            {collapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Cambiar tema</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full h-10 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={signOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Cerrar sesión</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar sesión</span>
                </Button>
              </>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-[280px]"
        )}>
          {/* Header */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-serif font-bold text-foreground">{title}</h1>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showSearch && (
                  <div className="hidden md:flex relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar..."
                      className="w-64 pl-9 h-9 bg-muted/50"
                    />
                  </div>
                )}

                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifications > 9 ? "9+" : notifications}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Preferencias
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
