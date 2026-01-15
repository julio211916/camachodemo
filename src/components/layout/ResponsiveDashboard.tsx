import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, Clock, Users, Activity, TrendingUp, 
  CalendarDays, CheckCircle2, DollarSign, Stethoscope,
  LayoutGrid, ChevronDown, ChevronUp, Maximize2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameDay, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from 'framer-motion';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  trend?: { value: number; label: string };
}

interface ResponsiveDashboardProps {
  appointments: any[];
  treatments?: any[];
  userRole: 'admin' | 'admin_sucursal' | 'doctor' | 'patient';
  userName?: string;
  branchName?: string;
  isGlobal?: boolean;
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  danger: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const iconBgClasses = {
  primary: 'bg-primary/20',
  success: 'bg-green-500/20',
  warning: 'bg-amber-500/20',
  info: 'bg-blue-500/20',
  danger: 'bg-red-500/20',
};

export function ResponsiveDashboard({
  appointments = [],
  treatments = [],
  userRole,
  userName,
  branchName,
  isGlobal = false,
}: ResponsiveDashboardProps) {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

  const todayAppointments = useMemo(() => 
    appointments.filter(apt => isSameDay(new Date(apt.appointment_date), new Date())),
    [appointments]
  );

  const weekAppointments = useMemo(() => 
    appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return d >= startOfWeek(new Date(), { locale: es }) && d <= endOfWeek(new Date(), { locale: es });
    }),
    [appointments]
  );

  const stats: StatCard[] = useMemo(() => {
    const baseStats: StatCard[] = [
      {
        label: "Citas Hoy",
        value: todayAppointments.length,
        icon: CalendarDays,
        color: "primary",
        trend: { value: 12, label: "vs ayer" }
      },
      {
        label: "Pendientes",
        value: appointments.filter(a => a.status === "pending").length,
        icon: Clock,
        color: "warning"
      },
      {
        label: "Confirmadas",
        value: appointments.filter(a => a.status === "confirmed").length,
        icon: CheckCircle2,
        color: "success"
      },
      {
        label: "Total Citas",
        value: appointments.length,
        icon: Calendar,
        color: "info"
      }
    ];

    if (userRole === 'doctor') {
      return [
        ...baseStats.slice(0, 2),
        {
          label: "Tratamientos Activos",
          value: treatments.filter(t => t.status === "in_progress").length,
          icon: Activity,
          color: "success"
        },
        {
          label: "Esta Semana",
          value: weekAppointments.length,
          icon: TrendingUp,
          color: "info"
        }
      ];
    }

    return baseStats;
  }, [appointments, treatments, todayAppointments, weekAppointments, userRole]);

  const pendingAppointments = useMemo(() =>
    appointments
      .filter(a => a.status === 'pending' || a.status === 'confirmed')
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
      .slice(0, 5),
    [appointments]
  );

  const recentCompleted = useMemo(() =>
    appointments
      .filter(a => a.status === 'completed')
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
      .slice(0, 5),
    [appointments]
  );

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-6 p-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              {userName ? `Bienvenido, ${userName}` : 'Panel de control'}
              {branchName && !isGlobal && <span className="text-primary"> • {branchName}</span>}
              {isGlobal && <Badge variant="secondary" className="ml-2">Vista Global</Badge>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn("border transition-all hover:shadow-md", colorClasses[stat.color])}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium opacity-70">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-xs opacity-60">
                        <TrendingUp className="inline w-3 h-3 mr-1" />
                        +{stat.trend.value}% {stat.trend.label}
                      </p>
                    )}
                  </div>
                  <div className={cn("p-2 rounded-lg", iconBgClasses[stat.color])}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Programadas</p>
                  <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
                </div>
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
                  <p className="text-xs text-muted-foreground mb-1">Completadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {appointments.filter(a => a.status === 'completed' && isSameDay(new Date(a.appointment_date), new Date())).length}
                  </p>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {appointments.filter(a => a.status === 'pending' && isSameDay(new Date(a.appointment_date), new Date())).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarDays className="w-4 h-4" />
                Nueva Cita
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" />
                Nuevo Paciente
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <DollarSign className="w-4 h-4" />
                Registrar Pago
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Stethoscope className="w-4 h-4" />
                Nuevo Tratamiento
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Appointments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {pendingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay citas pendientes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingAppointments.map((apt) => (
                      <div 
                        key={apt.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{apt.patient_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.service_name}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium">
                            {format(new Date(apt.appointment_date), 'd MMM', { locale: es })}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                        </div>
                        <Badge 
                          variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Completed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Citas Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {recentCompleted.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay citas completadas recientes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentCompleted.map((apt) => (
                      <div 
                        key={apt.id} 
                        className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{apt.patient_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.service_name}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-green-600">
                            {format(new Date(apt.appointment_date), 'd MMM', { locale: es })}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Week Overview - Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Vista Semanal
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total esta semana</p>
                    <p className="text-2xl font-bold">{weekAppointments.length}</p>
                  </div>
                  <div className="space-y-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => {
                      const dayCount = Math.floor(Math.random() * 10);
                      const percentage = Math.min((dayCount / 10) * 100, 100);
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="text-xs w-8 text-muted-foreground">{day}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs w-6 text-right">{dayCount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}

export default ResponsiveDashboard;
