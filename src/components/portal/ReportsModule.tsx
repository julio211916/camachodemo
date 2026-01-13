import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, DollarSign, Calendar, Download,
  FileSpreadsheet, PieChart, Activity, Target, ArrowUp, ArrowDown,
  Filter, RefreshCw, Printer, Clock, Star, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie,
  Pie, Cell, Legend
} from "recharts";
import * as XLSX from "xlsx";

// Mock data for charts
const revenueData = [
  { mes: 'Jul', ingresos: 145000, gastos: 82000, pacientes: 89 },
  { mes: 'Ago', ingresos: 168000, gastos: 95000, pacientes: 102 },
  { mes: 'Sep', ingresos: 152000, gastos: 78000, pacientes: 95 },
  { mes: 'Oct', ingresos: 189000, gastos: 98000, pacientes: 118 },
  { mes: 'Nov', ingresos: 175000, gastos: 88000, pacientes: 105 },
  { mes: 'Dic', ingresos: 210000, gastos: 105000, pacientes: 128 },
  { mes: 'Ene', ingresos: 195000, gastos: 92000, pacientes: 115 },
];

const treatmentData = [
  { name: 'Profilaxis', value: 32, color: '#3B82F6' },
  { name: 'Endodoncia', value: 18, color: '#10B981' },
  { name: 'Implantes', value: 12, color: '#F59E0B' },
  { name: 'Ortodoncia', value: 15, color: '#8B5CF6' },
  { name: 'Blanqueamiento', value: 23, color: '#EC4899' },
];

const conversionData = [
  { mes: 'Jul', consultas: 150, presupuestos: 95, aceptados: 72 },
  { mes: 'Ago', consultas: 175, presupuestos: 110, aceptados: 85 },
  { mes: 'Sep', consultas: 160, presupuestos: 98, aceptados: 78 },
  { mes: 'Oct', consultas: 190, presupuestos: 125, aceptados: 102 },
  { mes: 'Nov', consultas: 180, presupuestos: 115, aceptados: 88 },
  { mes: 'Dic', consultas: 220, presupuestos: 145, aceptados: 118 },
  { mes: 'Ene', consultas: 200, presupuestos: 130, aceptados: 95 },
];

const doctorPerformance = [
  { id: '1', nombre: 'Dr. Roberto García', pacientes: 145, ingresos: 285000, rating: 4.8, citas: 320 },
  { id: '2', nombre: 'Dra. María López', pacientes: 128, ingresos: 245000, rating: 4.9, citas: 290 },
  { id: '3', nombre: 'Dr. Carlos Mendoza', pacientes: 112, ingresos: 198000, rating: 4.7, citas: 245 },
  { id: '4', nombre: 'Dra. Ana Martínez', pacientes: 98, ingresos: 178000, rating: 4.6, citas: 210 },
];

const locationPerformance = [
  { id: '1', nombre: 'Sucursal Centro', pacientes: 450, ingresos: 890000, ocupacion: 85 },
  { id: '2', nombre: 'Sucursal Norte', pacientes: 320, ingresos: 620000, ocupacion: 72 },
  { id: '3', nombre: 'Sucursal Sur', pacientes: 280, ingresos: 520000, ocupacion: 68 },
];

const excelReports = [
  { id: '1', nombre: 'Resumen de Cobranza', descripcion: 'Últimos 30 días', icon: DollarSign },
  { id: '2', nombre: 'Listado de Pacientes', descripcion: 'Activos e inactivos', icon: Users },
  { id: '3', nombre: 'Citas por Período', descripcion: 'Detalle de agenda', icon: Calendar },
  { id: '4', nombre: 'Tratamientos Realizados', descripcion: 'Por profesional', icon: Activity },
  { id: '5', nombre: 'Pagos Recibidos', descripcion: 'Por medio de pago', icon: DollarSign },
  { id: '6', nombre: 'Inventario Actual', descripcion: 'Stock y alertas', icon: FileSpreadsheet },
  { id: '7', nombre: 'Convenios y Descuentos', descripcion: 'Desglose por empresa', icon: Building2 },
  { id: '8', nombre: 'Liquidaciones', descripcion: 'Comisiones profesionales', icon: DollarSign },
];

// Navigation sections
const reportSections = [
  { id: 'dashboard', label: 'Panel de Desempeño', icon: BarChart3 },
  { id: 'excel', label: 'Reportes Excel', icon: FileSpreadsheet },
  { id: 'graficos', label: 'Reportes Gráficos', icon: PieChart },
  { id: 'conversion', label: 'Análisis Conversión', icon: Target },
  { id: 'doctores', label: 'Desempeño Doctores', icon: Users },
  { id: 'sucursales', label: 'Análisis Sucursales', icon: Building2 },
];

export const ReportsModule = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const exportToExcel = (reportName: string, data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Reporte exportado", description: `${reportName} descargado exitosamente` });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection dateRange={dateRange} />;
      case 'excel':
        return <ExcelReportsSection onExport={exportToExcel} />;
      case 'graficos':
        return <GraphReportsSection />;
      case 'conversion':
        return <ConversionAnalysisSection />;
      case 'doctores':
        return <DoctorPerformanceSection data={doctorPerformance} />;
      case 'sucursales':
        return <LocationAnalysisSection data={locationPerformance} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Reportes
            </h3>
            {reportSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1 ${
                  activeSection === section.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <section.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{section.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Filters */}
        <div className="p-4 border-t space-y-3">
          <div>
            <Label className="text-xs">Período</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sucursal</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="centro">Centro</SelectItem>
                <SelectItem value="norte">Norte</SelectItem>
                <SelectItem value="sur">Sur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

// Dashboard Section
const DashboardSection = ({ dateRange }: { dateRange: string }) => {
  const kpis = [
    { label: 'Ingresos Totales', value: '$1,234,000', change: 12.5, icon: DollarSign, color: 'text-green-500' },
    { label: 'Pacientes Atendidos', value: '752', change: 8.3, icon: Users, color: 'text-blue-500' },
    { label: 'Citas Completadas', value: '1,245', change: -2.1, icon: Calendar, color: 'text-purple-500' },
    { label: 'Tasa Conversión', value: '73%', change: 5.2, icon: Target, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Panel de Desempeño
          </h2>
          <p className="text-muted-foreground">Métricas clave del negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className={`flex items-center text-sm ${kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpi.change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {Math.abs(kpi.change)}% vs periodo anterior
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-muted ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10B981" fill="#10B98133" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stroke="#EF4444" fill="#EF444433" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tratamientos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={treatmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {treatmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patients Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendencia de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Line type="monotone" dataKey="pacientes" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Excel Reports Section
const ExcelReportsSection = ({ onExport }: { onExport: (name: string, data: any[]) => void }) => {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleExport = (report: typeof excelReports[0]) => {
    // Generate mock data based on report type
    const mockData = [
      { fecha: '2026-01-10', concepto: 'Consulta', monto: 500, paciente: 'Juan Pérez' },
      { fecha: '2026-01-11', concepto: 'Limpieza', monto: 800, paciente: 'María López' },
      { fecha: '2026-01-12', concepto: 'Endodoncia', monto: 4500, paciente: 'Carlos García' },
    ];
    onExport(report.nombre, mockData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          Reportes Excel
        </h2>
        <p className="text-muted-foreground">Exporta datos a formato Excel</p>
      </div>

      {/* Date Range */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div>
              <Label>Fecha Desde</Label>
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Fecha Hasta</Label>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {excelReports.map(report => (
          <Card key={report.id} className="hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <report.icon className="w-5 h-5" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleExport(report)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-semibold mt-3">{report.nombre}</h3>
              <p className="text-sm text-muted-foreground">{report.descripcion}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Graph Reports Section
const GraphReportsSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <PieChart className="w-6 h-6" />
        Reportes Gráficos
      </h2>
      <p className="text-muted-foreground">Visualizaciones detalladas</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingresos por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={treatmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {treatmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Conversion Analysis Section
const ConversionAnalysisSection = () => {
  const conversionRate = 73;
  const avgConversion = 68;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6" />
          Análisis de Conversión
        </h2>
        <p className="text-muted-foreground">Mide la conversión de citas a presupuestos aceptados</p>
      </div>

      {/* Conversion KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-green-600">{conversionRate}%</p>
            <p className="text-sm text-muted-foreground">Conversión Actual</p>
            <p className="text-xs text-green-600 mt-1">+5% vs promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{avgConversion}%</p>
            <p className="text-sm text-muted-foreground">Promedio Histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">542</p>
            <p className="text-sm text-muted-foreground">Presupuestos Aceptados</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Embudo de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="mes" type="category" className="text-xs" />
              <Tooltip 
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="consultas" fill="#3B82F6" name="Consultas" radius={[0, 4, 4, 0]} />
              <Bar dataKey="presupuestos" fill="#F59E0B" name="Presupuestos" radius={[0, 4, 4, 0]} />
              <Bar dataKey="aceptados" fill="#10B981" name="Aceptados" radius={[0, 4, 4, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendencia de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={conversionData.map(d => ({
              ...d,
              tasaConversion: Math.round((d.aceptados / d.consultas) * 100)
            }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                formatter={(value: number) => `${value}%`}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Line 
                type="monotone" 
                dataKey="tasaConversion" 
                stroke="#10B981" 
                strokeWidth={2} 
                dot={{ fill: '#10B981' }}
                name="Tasa de Conversión"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Doctor Performance Section
const DoctorPerformanceSection = ({ data }: { data: typeof doctorPerformance }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Desempeño por Doctor
        </h2>
        <p className="text-muted-foreground">Métricas individuales de profesionales</p>
      </div>
      <Button variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map(doc => (
        <Card key={doc.id} className="hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{doc.nombre}</p>
                <div className="flex items-center text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1">{doc.rating}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pacientes</span>
                <span className="font-medium">{doc.pacientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingresos</span>
                <span className="font-medium text-green-600">${doc.ingresos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Citas</span>
                <span className="font-medium">{doc.citas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativa de Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
            <YAxis dataKey="nombre" type="category" className="text-xs" width={120} />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="ingresos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// Location Analysis Section
const LocationAnalysisSection = ({ data }: { data: typeof locationPerformance }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="w-6 h-6" />
        Análisis por Sucursal
      </h2>
      <p className="text-muted-foreground">Rendimiento de cada ubicación</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map(loc => (
        <Card key={loc.id}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">{loc.nombre}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Ocupación</span>
                  <span className="font-medium">{loc.ocupacion}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${loc.ocupacion}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pacientes</span>
                <span className="font-medium">{loc.pacientes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ingresos</span>
                <span className="font-medium text-green-600">${loc.ingresos.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativa de Sucursales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="nombre" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
