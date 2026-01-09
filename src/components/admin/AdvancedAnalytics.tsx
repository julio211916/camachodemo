import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const AdvancedAnalytics = () => {
  // Fetch all appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['analytics-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ['analytics-treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch all doctors with profiles
  const { data: doctors = [] } = useQuery({
    queryKey: ['analytics-doctors'],
    queryFn: async () => {
      const { data: doctorsData, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;

      const doctorsWithProfiles = await Promise.all(
        doctorsData.map(async (doctor) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', doctor.user_id)
            .single();
          return { ...doctor, profile };
        })
      );
      return doctorsWithProfiles;
    },
  });

  // Calculate revenue from treatments
  const revenueData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTreatments = treatments.filter(t => {
        const date = parseISO(t.start_date);
        return date >= monthStart && date <= monthEnd;
      });

      const revenue = monthTreatments.reduce((sum, t) => sum + (t.cost || 0), 0);
      const completed = monthTreatments.filter(t => t.status === 'completed').length;
      const inProgress = monthTreatments.filter(t => t.status === 'in_progress').length;

      return {
        month: format(month, 'MMM yyyy', { locale: es }),
        ingresos: revenue,
        completados: completed,
        enProgreso: inProgress,
      };
    });
  }, [treatments]);

  // Monthly appointments trend
  const monthlyTrend = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthAppointments = appointments.filter(a => {
        const date = parseISO(a.appointment_date);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        month: format(month, 'MMM', { locale: es }),
        citas: monthAppointments.length,
        completadas: monthAppointments.filter(a => a.status === 'completed').length,
        canceladas: monthAppointments.filter(a => a.status === 'cancelled').length,
      };
    });
  }, [appointments]);

  // Appointments by doctor
  const appointmentsByDoctor = useMemo(() => {
    const doctorStats: Record<string, { name: string; total: number; completed: number }> = {};

    appointments.forEach(apt => {
      if (apt.doctor_id) {
        const doctor = doctors.find(d => d.id === apt.doctor_id);
        const name = doctor?.profile?.full_name || 'Sin asignar';
        if (!doctorStats[apt.doctor_id]) {
          doctorStats[apt.doctor_id] = { name, total: 0, completed: 0 };
        }
        doctorStats[apt.doctor_id].total++;
        if (apt.status === 'completed') {
          doctorStats[apt.doctor_id].completed++;
        }
      }
    });

    return Object.values(doctorStats).sort((a, b) => b.total - a.total);
  }, [appointments, doctors]);

  // Revenue by doctor
  const revenueByDoctor = useMemo(() => {
    const doctorRevenue: Record<string, { name: string; revenue: number; treatments: number }> = {};

    treatments.forEach(t => {
      if (t.doctor_id) {
        const doctor = doctors.find(d => d.id === t.doctor_id);
        const name = doctor?.profile?.full_name || 'Sin asignar';
        if (!doctorRevenue[t.doctor_id]) {
          doctorRevenue[t.doctor_id] = { name, revenue: 0, treatments: 0 };
        }
        doctorRevenue[t.doctor_id].revenue += t.cost || 0;
        doctorRevenue[t.doctor_id].treatments++;
      }
    });

    return Object.values(doctorRevenue).sort((a, b) => b.revenue - a.revenue);
  }, [treatments, doctors]);

  // Calculate totals
  const totalRevenue = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(1) : 0;

  // Monthly comparison
  const thisMonth = appointments.filter(a => {
    const date = parseISO(a.appointment_date);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  }).length;
  
  const lastMonth = appointments.filter(a => {
    const date = parseISO(a.appointment_date);
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
    return date >= lastMonthStart && date <= lastMonthEnd;
  }).length;

  const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-primary" />
          Métricas Avanzadas
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  Ingresos
                </Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">€{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total facturado</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-primary" />
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  Number(monthlyGrowth) >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {Number(monthlyGrowth) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {monthlyGrowth}%
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{thisMonth}</p>
              <p className="text-sm text-muted-foreground">Citas este mes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Stethoscope className="w-8 h-8 text-blue-500" />
                <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                  Doctores
                </Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{doctors.length}</p>
              <p className="text-sm text-muted-foreground">Doctores activos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-amber-500" />
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  Tasa
                </Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-sm text-muted-foreground">Citas completadas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="doctors">Por Doctor</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Ingresos Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                      <YAxis className="text-muted-foreground text-xs" tickFormatter={(value) => `€${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Ingresos']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ingresos"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Ingresos por Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByDoctor.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(value) => `€${value}`} className="text-muted-foreground text-xs" />
                      <YAxis type="category" dataKey="name" width={100} className="text-muted-foreground text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Ingresos']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {revenueByDoctor.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Citas por Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentsByDoctor.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-muted-foreground text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                      />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Distribución de Citas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentsByDoctor.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="name"
                        label={({ name, total }) => `${name.split(' ')[0]}: ${total}`}
                      >
                        {appointmentsByDoctor.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Tendencias Mensuales de Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                    <YAxis className="text-muted-foreground text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="citas" name="Total Citas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="completadas" name="Completadas" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="canceladas" name="Canceladas" stroke="#ef4444" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Tratamientos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completados" name="Completados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="enProgreso" name="En Progreso" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Tasa de Completación', value: `${completionRate}%`, color: 'text-green-500' },
                  { label: 'Promedio por Doctor', value: `€${(totalRevenue / (doctors.length || 1)).toFixed(0)}`, color: 'text-blue-500' },
                  { label: 'Citas por Doctor', value: `${(totalAppointments / (doctors.length || 1)).toFixed(1)}`, color: 'text-primary' },
                  { label: 'Tratamientos Activos', value: treatments.filter(t => t.status === 'in_progress').length.toString(), color: 'text-amber-500' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("text-xl font-bold", item.color)}>{item.value}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
