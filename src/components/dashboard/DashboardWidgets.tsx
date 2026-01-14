import { ReactNode, useMemo } from 'react';
import { 
  Calendar, Clock, Users, Activity, TrendingUp, 
  CalendarDays, CheckCircle2, Wallet
} from 'lucide-react';
import { DraggableGridLayout, GridWidget } from '@/components/layout/DraggableGridLayout';
import { StatsGrid } from '@/components/layout/DashboardStats';
import { ContentCard, PageHeader } from '@/components/layout/ContentCard';
import { AdminAppointmentsList } from '@/components/admin/AdminAppointmentsList';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { isToday, parseISO, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

interface DashboardWidgetsProps {
  appointments: any[];
  treatments?: any[];
  userRole: 'admin' | 'doctor';
  userName?: string;
}

export const DashboardWidgets = ({ 
  appointments, 
  treatments = [],
  userRole,
  userName 
}: DashboardWidgetsProps) => {
  
  const todayAppointments = appointments.filter(apt => 
    isSameDay(new Date(apt.appointment_date), new Date())
  );

  const weekAppointments = appointments.filter(a => { 
    const d = new Date(a.appointment_date); 
    return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date()); 
  });

  const stats = useMemo(() => {
    if (userRole === 'admin') {
      return [
        {
          label: "Citas Hoy",
          value: todayAppointments.length,
          icon: CalendarDays,
          color: "primary" as const,
          trend: { value: 12, label: "vs ayer" }
        },
        {
          label: "Pendientes",
          value: appointments.filter(a => a.status === "pending").length,
          icon: Clock,
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
      ];
    }
    
    return [
      { label: "Citas Hoy", value: todayAppointments.length, icon: Calendar, color: "primary" as const },
      { label: "Pendientes", value: appointments.filter(a => a.status === "pending").length, icon: Clock, color: "warning" as const },
      { label: "Tratamientos Activos", value: treatments.filter(t => t.status === "in_progress").length, icon: Activity, color: "success" as const },
      { label: "Esta Semana", value: weekAppointments.length, icon: TrendingUp, color: "info" as const },
    ];
  }, [appointments, treatments, todayAppointments, weekAppointments, userRole]);

  // Define default widgets
  const defaultWidgets: GridWidget[] = useMemo(() => [
    {
      id: 'stats',
      title: 'Estadísticas',
      icon: <TrendingUp className="w-4 h-4" />,
      component: <StatsGrid stats={stats} />,
      colSpan: 4,
      rowSpan: 1,
      locked: true,
      visible: true
    },
    {
      id: 'appointments',
      title: 'Citas Recientes',
      icon: <CalendarDays className="w-4 h-4" />,
      component: <AdminAppointmentsList appointments={appointments.slice(0, 5)} compact />,
      colSpan: 2,
      rowSpan: 2,
      visible: true
    },
    {
      id: 'analytics',
      title: 'Analytics Rápido',
      icon: <Activity className="w-4 h-4" />,
      component: <AnalyticsDashboard />,
      colSpan: 2,
      rowSpan: 2,
      visible: true
    },
    {
      id: 'today-summary',
      title: 'Resumen del Día',
      icon: <Calendar className="w-4 h-4" />,
      component: (
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Citas programadas</span>
            <span className="text-lg font-bold text-primary">{todayAppointments.length}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
            <span className="text-sm font-medium">Completadas</span>
            <span className="text-lg font-bold text-green-600">{appointments.filter(a => a.status === 'completed' && isSameDay(new Date(a.appointment_date), new Date())).length}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg">
            <span className="text-sm font-medium">Pendientes</span>
            <span className="text-lg font-bold text-amber-600">{appointments.filter(a => a.status === 'pending' && isSameDay(new Date(a.appointment_date), new Date())).length}</span>
          </div>
        </div>
      ),
      colSpan: 1,
      rowSpan: 1,
      visible: true
    },
    {
      id: 'week-overview',
      title: 'Vista Semanal',
      icon: <CalendarDays className="w-4 h-4" />,
      component: (
        <div className="space-y-2">
          <p className="text-2xl font-bold">{weekAppointments.length}</p>
          <p className="text-sm text-muted-foreground">citas esta semana</p>
          <div className="mt-4 space-y-1">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, i) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-xs w-8">{day}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.random() * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      colSpan: 1,
      rowSpan: 1,
      visible: true
    }
  ], [stats, appointments, todayAppointments, weekAppointments]);

  const { 
    widgets, 
    columns, 
    isLoaded, 
    handleWidgetsChange 
  } = useDashboardLayout(`${userRole}-dashboard`, defaultWidgets);

  if (!isLoaded) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  // Merge saved widget state with actual components
  const widgetsWithComponents = widgets.map(savedWidget => {
    const defaultWidget = defaultWidgets.find(d => d.id === savedWidget.id);
    return {
      ...savedWidget,
      component: defaultWidget?.component || <div>Widget no disponible</div>,
      icon: defaultWidget?.icon
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        subtitle={userName ? `Bienvenido de vuelta, ${userName}` : undefined}
      />
      <DraggableGridLayout
        widgets={widgetsWithComponents}
        onWidgetsChange={handleWidgetsChange}
        columns={columns}
        editable={true}
      />
    </div>
  );
};
