import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Users, Clock, CheckCircle2, AlertTriangle, Calendar,
  TrendingUp, DollarSign, Filter, Search, ChevronRight, BarChart3,
  ArrowUpRight, ArrowDownRight, FileText, Eye, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

// Treatment plan type based on what we know from TreatmentPlanGenerator
interface TreatmentPlanSummary {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  totalProcedures: number;
  completedProcedures: number;
  pendingProcedures: number;
  inProgressProcedures: number;
  totalCost: number;
  paidAmount: number;
  completionPercentage: number;
  startDate: string;
  estimatedEndDate: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  lastActivity: string;
  nextAppointment?: string;
}

const STATUS_CONFIG = {
  active: { label: 'Activo', color: 'bg-green-500/10 text-green-600 border-green-500/20', bgColor: '#22c55e' },
  completed: { label: 'Completado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', bgColor: '#3b82f6' },
  paused: { label: 'Pausado', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', bgColor: '#eab308' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-600 border-red-500/20', bgColor: '#ef4444' },
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];

// Mock data for demonstration - in production this would come from DB
const mockTreatmentPlans: TreatmentPlanSummary[] = [
  {
    id: 'TP-001',
    patientId: 'P001',
    patientName: 'María García López',
    doctorName: 'Dr. Carlos Mendoza',
    totalProcedures: 8,
    completedProcedures: 5,
    pendingProcedures: 2,
    inProgressProcedures: 1,
    totalCost: 45000,
    paidAmount: 30000,
    completionPercentage: 62,
    startDate: '2024-01-15',
    estimatedEndDate: '2024-06-15',
    status: 'active',
    lastActivity: '2024-01-10',
    nextAppointment: '2024-01-18',
  },
  {
    id: 'TP-002',
    patientId: 'P002',
    patientName: 'Juan Rodríguez Martínez',
    doctorName: 'Dra. Ana Silva',
    totalProcedures: 5,
    completedProcedures: 5,
    pendingProcedures: 0,
    inProgressProcedures: 0,
    totalCost: 28000,
    paidAmount: 28000,
    completionPercentage: 100,
    startDate: '2023-11-01',
    estimatedEndDate: '2024-01-01',
    status: 'completed',
    lastActivity: '2024-01-05',
  },
  {
    id: 'TP-003',
    patientId: 'P003',
    patientName: 'Laura Fernández Ruiz',
    doctorName: 'Dr. Carlos Mendoza',
    totalProcedures: 12,
    completedProcedures: 3,
    pendingProcedures: 8,
    inProgressProcedures: 1,
    totalCost: 85000,
    paidAmount: 25000,
    completionPercentage: 25,
    startDate: '2024-01-02',
    estimatedEndDate: '2024-12-01',
    status: 'active',
    lastActivity: '2024-01-12',
    nextAppointment: '2024-01-20',
  },
  {
    id: 'TP-004',
    patientId: 'P004',
    patientName: 'Roberto Sánchez Díaz',
    doctorName: 'Dra. Ana Silva',
    totalProcedures: 4,
    completedProcedures: 2,
    pendingProcedures: 2,
    inProgressProcedures: 0,
    totalCost: 18000,
    paidAmount: 9000,
    completionPercentage: 50,
    startDate: '2023-12-15',
    estimatedEndDate: '2024-03-15',
    status: 'paused',
    lastActivity: '2024-01-03',
  },
  {
    id: 'TP-005',
    patientId: 'P005',
    patientName: 'Carmen López Vega',
    doctorName: 'Dr. Carlos Mendoza',
    totalProcedures: 6,
    completedProcedures: 4,
    pendingProcedures: 1,
    inProgressProcedures: 1,
    totalCost: 35000,
    paidAmount: 25000,
    completionPercentage: 67,
    startDate: '2023-12-01',
    estimatedEndDate: '2024-04-01',
    status: 'active',
    lastActivity: '2024-01-11',
    nextAppointment: '2024-01-25',
  },
];

// Generate monthly progress data
const generateMonthlyData = () => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    months.push({
      month: format(date, 'MMM', { locale: es }),
      completed: Math.floor(Math.random() * 20) + 10,
      started: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 200000) + 100000,
    });
  }
  return months;
};

export const TreatmentProgressDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlanSummary | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // In production, this would fetch from DB
  const treatmentPlans = mockTreatmentPlans;
  const monthlyData = useMemo(() => generateMonthlyData(), []);

  // Calculate aggregated stats
  const stats = useMemo(() => {
    const active = treatmentPlans.filter(p => p.status === 'active').length;
    const completed = treatmentPlans.filter(p => p.status === 'completed').length;
    const paused = treatmentPlans.filter(p => p.status === 'paused').length;
    const totalProcedures = treatmentPlans.reduce((sum, p) => sum + p.totalProcedures, 0);
    const completedProcedures = treatmentPlans.reduce((sum, p) => sum + p.completedProcedures, 0);
    const totalRevenue = treatmentPlans.reduce((sum, p) => sum + p.totalCost, 0);
    const collectedRevenue = treatmentPlans.reduce((sum, p) => sum + p.paidAmount, 0);
    const avgCompletion = treatmentPlans.reduce((sum, p) => sum + p.completionPercentage, 0) / treatmentPlans.length;

    return {
      active,
      completed,
      paused,
      total: treatmentPlans.length,
      totalProcedures,
      completedProcedures,
      pendingProcedures: totalProcedures - completedProcedures,
      totalRevenue,
      collectedRevenue,
      pendingRevenue: totalRevenue - collectedRevenue,
      avgCompletion: Math.round(avgCompletion),
    };
  }, [treatmentPlans]);

  // Filter treatment plans
  const filteredPlans = useMemo(() => {
    return treatmentPlans.filter(plan => {
      const matchesSearch = plan.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           plan.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      const matchesDoctor = doctorFilter === 'all' || plan.doctorName === doctorFilter;
      return matchesSearch && matchesStatus && matchesDoctor;
    });
  }, [treatmentPlans, searchTerm, statusFilter, doctorFilter]);

  // Get unique doctors
  const doctors = useMemo(() => {
    return [...new Set(treatmentPlans.map(p => p.doctorName))];
  }, [treatmentPlans]);

  // Status distribution for pie chart
  const statusDistribution = [
    { name: 'Activos', value: stats.active, color: STATUS_CONFIG.active.bgColor },
    { name: 'Completados', value: stats.completed, color: STATUS_CONFIG.completed.bgColor },
    { name: 'Pausados', value: stats.paused, color: STATUS_CONFIG.paused.bgColor },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planes Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-1">de {stats.total} total</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avance Promedio</p>
                <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
                <Progress value={stats.avgCompletion} className="mt-2 h-2" />
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Procedimientos</p>
                <p className="text-2xl font-bold">{stats.completedProcedures}/{stats.totalProcedures}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingProcedures} pendientes</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold">${(stats.collectedRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(stats.pendingRevenue / 1000).toFixed(0)}K por cobrar
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Progreso Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                  name="Completados"
                />
                <Area 
                  type="monotone" 
                  dataKey="started" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Iniciados"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treatment Plans List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Planes de Tratamiento
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {doctors.map(doc => (
                    <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowDetailDialog(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {plan.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{plan.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{plan.id} • {plan.doctorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={STATUS_CONFIG[plan.status].color}>
                        {STATUS_CONFIG[plan.status].label}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Procedimientos</p>
                      <p className="font-medium">{plan.completedProcedures}/{plan.totalProcedures}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                      <p className="font-medium">${plan.totalCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pagado</p>
                      <p className="font-medium text-green-600">${plan.paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Próxima Cita</p>
                      <p className="font-medium">
                        {plan.nextAppointment 
                          ? format(new Date(plan.nextAppointment), "d MMM", { locale: es })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress value={plan.completionPercentage} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-12 text-right">{plan.completionPercentage}%</span>
                  </div>
                </motion.div>
              ))}

              {filteredPlans.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron planes de tratamiento</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Plan de Tratamiento</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedPlan.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedPlan.patientName}</h3>
                  <p className="text-muted-foreground">{selectedPlan.id} • {selectedPlan.doctorName}</p>
                </div>
                <Badge variant="outline" className={`ml-auto ${STATUS_CONFIG[selectedPlan.status].color}`}>
                  {STATUS_CONFIG[selectedPlan.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Progreso</p>
                    <p className="text-2xl font-bold">{selectedPlan.completionPercentage}%</p>
                    <Progress value={selectedPlan.completionPercentage} className="mt-2 h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{selectedPlan.completedProcedures} completados</span>
                      <span>{selectedPlan.pendingProcedures} pendientes</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Financiero</p>
                    <p className="text-2xl font-bold">${selectedPlan.paidAmount.toLocaleString()}</p>
                    <Progress 
                      value={(selectedPlan.paidAmount / selectedPlan.totalCost) * 100} 
                      className="mt-2 h-2" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Pagado</span>
                      <span>de ${selectedPlan.totalCost.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <p className="font-medium">{format(new Date(selectedPlan.startDate), "d MMM yyyy", { locale: es })}</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Última Actividad</p>
                  <p className="font-medium">{format(new Date(selectedPlan.lastActivity), "d MMM yyyy", { locale: es })}</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Est. Finalización</p>
                  <p className="font-medium">{format(new Date(selectedPlan.estimatedEndDate), "d MMM yyyy", { locale: es })}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Plan Completo
                </Button>
                <Button className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar Estado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
