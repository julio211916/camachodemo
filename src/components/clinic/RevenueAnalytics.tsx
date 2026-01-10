import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart,
  Area,
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
  Legend
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const RevenueAnalytics = () => {
  const [period, setPeriod] = useState("6months");

  // Fetch treatments data
  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch appointments data
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTreatments = treatments.filter(t => 
      new Date(t.created_at) >= thisMonth
    );
    const lastMonthTreatments = treatments.filter(t => {
      const date = new Date(t.created_at);
      return date >= lastMonth && date <= lastMonthEnd;
    });

    const thisMonthRevenue = thisMonthTreatments.reduce((acc, t) => acc + (t.cost || 0), 0);
    const lastMonthRevenue = lastMonthTreatments.reduce((acc, t) => acc + (t.cost || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) 
      : 0;

    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const conversionRate = appointments.length > 0 
      ? (completedAppointments / appointments.length * 100) 
      : 0;

    const avgTicket = treatments.length > 0 
      ? treatments.reduce((acc, t) => acc + (t.cost || 0), 0) / treatments.length 
      : 0;

    const totalRevenue = treatments.reduce((acc, t) => acc + (t.cost || 0), 0);

    return {
      totalRevenue,
      thisMonthRevenue,
      revenueGrowth,
      conversionRate,
      avgTicket,
      totalPatients: new Set(treatments.map(t => t.patient_id)).size,
      completedTreatments: treatments.filter(t => t.status === 'completed').length,
      activeTreatments: treatments.filter(t => t.status === 'in_progress').length
    };
  }, [treatments, appointments]);

  // Monthly revenue data for chart
  const monthlyData = useMemo(() => {
    const months = parseInt(period.replace('months', ''));
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTreatments = treatments.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      data.push({
        month: format(date, 'MMM', { locale: es }),
        ingresos: monthTreatments.reduce((acc, t) => acc + (t.cost || 0), 0),
        tratamientos: monthTreatments.length,
        pacientes: new Set(monthTreatments.map(t => t.patient_id)).size
      });
    }
    
    return data;
  }, [treatments, period]);

  // Service distribution
  const serviceData = useMemo(() => {
    const serviceMap = new Map<string, number>();
    treatments.forEach(t => {
      const current = serviceMap.get(t.name) || 0;
      serviceMap.set(t.name, current + (t.cost || 0));
    });
    
    return Array.from(serviceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [treatments]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-primary/50" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {metrics.revenueGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.thisMonthRevenue)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500/50" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(), 'MMMM yyyy', { locale: es })}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.avgTicket)}</p>
                </div>
                <Target className="w-10 h-10 text-blue-500/50" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  Por tratamiento
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.conversionRate.toFixed(1)}%</p>
                </div>
                <Users className="w-10 h-10 text-amber-500/50" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  Citas → Tratamientos
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Tendencia de Ingresos
              </CardTitle>
              <CardDescription>Evolución mensual de ingresos y tratamientos</CardDescription>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 meses</SelectItem>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="12months">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Servicio</CardTitle>
            <CardDescription>Top 5 servicios más rentables</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {serviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{metrics.totalPatients}</p>
              <p className="text-sm text-muted-foreground mt-1">Pacientes Atendidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{metrics.completedTreatments}</p>
              <p className="text-sm text-muted-foreground mt-1">Tratamientos Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{metrics.activeTreatments}</p>
              <p className="text-sm text-muted-foreground mt-1">Tratamientos en Proceso</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
