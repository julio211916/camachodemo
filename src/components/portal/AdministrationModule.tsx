import { useState } from "react";
import { motion } from "framer-motion";
import {
  Handshake, Receipt, Package, FlaskConical, Wallet, GitMerge,
  CreditCard, ListCheck, DollarSign, Building2, FileText, ScrollText,
  Image, CreditCard as PaymentIcon, XCircle, Settings, ChevronRight,
  Plus, Search, Edit2, Trash2, MoreHorizontal, Calendar, Percent,
  Download, Filter, BarChart3, Users, Eye, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Import existing managers
import { InventoryManager } from "@/components/clinic/InventoryManager";
import { ExpensesManager } from "@/components/clinic/ExpensesManager";
import { LabOrdersManager } from "@/components/clinic/LabOrdersManager";

// Types
interface Convenio {
  id: string;
  empresa: string;
  contacto: string;
  email: string;
  telefono: string;
  descuento: number;
  fechaAfiliacion: Date;
  isActive: boolean;
  pacientesActivos: number;
}

interface Liquidacion {
  id: string;
  profesional: string;
  periodo: string;
  realizado: number;
  aPagar: number;
  comision: number;
  status: 'activa' | 'finalizada' | 'pendiente';
  fecha: Date;
}

interface PlanServicio {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioBase: number;
  duracion: number;
  isActive: boolean;
}

interface MedioPago {
  id: string;
  nombre: string;
  retencion: number;
  permiteDevoluciones: boolean;
  isActive: boolean;
}

interface ArancelPrecio {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioConvenio: number;
}

// Mock Data
const MOCK_CONVENIOS: Convenio[] = [
  { id: '1', empresa: 'COCA COLA', contacto: 'Juan Pérez', email: 'convenios@cocacola.com', telefono: '+52 555 111 2222', descuento: 0, fechaAfiliacion: new Date('2020-11-24'), isActive: true, pacientesActivos: 15 },
  { id: '2', empresa: 'GOVA CH, S. DE R.L. DE C.V.', contacto: 'María López', email: 'rh@gova.com', telefono: '+52 555 222 3333', descuento: 20, fechaAfiliacion: new Date('2021-06-21'), isActive: true, pacientesActivos: 8 },
  { id: '3', empresa: 'Renue Medical Centre', contacto: 'Carlos García', email: 'admin@renue.com', telefono: '+52 555 333 4444', descuento: 0, fechaAfiliacion: new Date('2023-11-06'), isActive: true, pacientesActivos: 3 },
  { id: '4', empresa: 'TEPIC', contacto: 'Ana Martínez', email: 'convenio@tepic.com', telefono: '+52 555 444 5555', descuento: 10, fechaAfiliacion: new Date('2023-11-12'), isActive: true, pacientesActivos: 5 },
];

const MOCK_LIQUIDACIONES: Liquidacion[] = [
  { id: '1', profesional: 'Dr. Roberto García', periodo: 'Enero 2026', realizado: 45000, aPagar: 13500, comision: 30, status: 'activa', fecha: new Date() },
  { id: '2', profesional: 'Dra. María López', periodo: 'Enero 2026', realizado: 38000, aPagar: 11400, comision: 30, status: 'activa', fecha: new Date() },
  { id: '3', profesional: 'Dr. Carlos Mendoza', periodo: 'Enero 2026', realizado: 52000, aPagar: 15600, comision: 30, status: 'pendiente', fecha: new Date() },
];

const MOCK_PLANES: PlanServicio[] = [
  { id: '1', codigo: 'LIMP-001', nombre: 'Limpieza Dental Básica', categoria: 'Profilaxis', precioBase: 800, duracion: 30, isActive: true },
  { id: '2', codigo: 'BLAN-001', nombre: 'Blanqueamiento LED', categoria: 'Estética', precioBase: 5500, duracion: 60, isActive: true },
  { id: '3', codigo: 'ENDO-001', nombre: 'Endodoncia Molar', categoria: 'Endodoncia', precioBase: 4500, duracion: 90, isActive: true },
  { id: '4', codigo: 'EXTR-001', nombre: 'Extracción Simple', categoria: 'Cirugía', precioBase: 1200, duracion: 30, isActive: true },
  { id: '5', codigo: 'CORO-001', nombre: 'Corona Zirconio', categoria: 'Prótesis', precioBase: 8000, duracion: 60, isActive: true },
  { id: '6', codigo: 'IMPL-001', nombre: 'Implante Dental', categoria: 'Implantología', precioBase: 18000, duracion: 120, isActive: true },
];

const MOCK_MEDIOS_PAGO: MedioPago[] = [
  { id: '1', nombre: 'Efectivo', retencion: 0, permiteDevoluciones: true, isActive: true },
  { id: '2', nombre: 'Tarjeta de Crédito', retencion: 0.99, permiteDevoluciones: false, isActive: true },
  { id: '3', nombre: 'Tarjeta de Débito', retencion: 0.99, permiteDevoluciones: false, isActive: true },
  { id: '4', nombre: 'Transferencia Electrónica', retencion: 0, permiteDevoluciones: true, isActive: true },
  { id: '5', nombre: 'Depósito Bancario', retencion: 0, permiteDevoluciones: false, isActive: true },
  { id: '6', nombre: 'Cheque', retencion: 0, permiteDevoluciones: true, isActive: true },
];

const MOCK_ARANCELES: ArancelPrecio[] = [
  { id: '1', codigo: 'DIAG-001', nombre: 'Consulta Diagnóstico', categoria: 'Diagnóstico', precio: 500, precioConvenio: 450 },
  { id: '2', codigo: 'DIAG-002', nombre: 'Radiografía Periapical', categoria: 'Diagnóstico', precio: 350, precioConvenio: 315 },
  { id: '3', codigo: 'PROP-001', nombre: 'Profilaxis Dental', categoria: 'Profilaxis', precio: 800, precioConvenio: 720 },
  { id: '4', codigo: 'REST-001', nombre: 'Resina Simple', categoria: 'Restauración', precio: 1200, precioConvenio: 1080 },
  { id: '5', codigo: 'ENDO-001', nombre: 'Endodoncia Anterior', categoria: 'Endodoncia', precio: 3500, precioConvenio: 3150 },
  { id: '6', codigo: 'CIRU-001', nombre: 'Extracción Simple', categoria: 'Cirugía', precio: 1200, precioConvenio: 1080 },
];

// Navigation Items
const adminSections = [
  { id: 'convenios', label: 'Convenios', icon: Handshake, description: 'Gestión de convenios empresariales' },
  { id: 'gastos', label: 'Gastos', icon: Receipt, description: 'Control de gastos operativos' },
  { id: 'inventario', label: 'Inventario', icon: Package, description: 'Stock y materiales' },
  { id: 'laboratorios', label: 'Laboratorios', icon: FlaskConical, description: 'Órdenes de laboratorio' },
  { id: 'liquidaciones', label: 'Liquidaciones', icon: Wallet, description: 'Nóminas y comisiones' },
  { id: 'fusion', label: 'Fusión de Fichas', icon: GitMerge, description: 'Combinar expedientes' },
  { id: 'pagos-tpv', label: 'Pagos TPV', icon: CreditCard, description: 'Terminal punto de venta' },
  { id: 'planes', label: 'Planes y Servicios', icon: ListCheck, description: 'Catálogo de servicios' },
];

const configSections = [
  { id: 'arancel', label: 'Arancel de Precios', icon: DollarSign, description: 'Lista de precios base' },
  { id: 'bancos', label: 'Bancos', icon: Building2, description: 'Entidades financieras' },
  { id: 'documentos', label: 'Documentos Clínicos', icon: FileText, description: 'Plantillas y formatos' },
  { id: 'consentimientos', label: 'Consentimientos', icon: ScrollText, description: 'Consentimientos informados' },
  { id: 'logotipo', label: 'Logotipo', icon: Image, description: 'Imagen corporativa' },
  { id: 'medios-pago', label: 'Opciones de Pago', icon: PaymentIcon, description: 'Medios de pago habilitados' },
  { id: 'pagos-anulados', label: 'Pagos Anulados', icon: XCircle, description: 'Gestión de anulaciones' },
];

export const AdministrationModule = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('convenios');
  const [convenios, setConvenios] = useState<Convenio[]>(MOCK_CONVENIOS);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>(MOCK_LIQUIDACIONES);
  const [planes, setPlanes] = useState<PlanServicio[]>(MOCK_PLANES);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>(MOCK_MEDIOS_PAGO);
  const [aranceles] = useState<ArancelPrecio[]>(MOCK_ARANCELES);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddConvenio, setShowAddConvenio] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showFusion, setShowFusion] = useState(false);
  const [newConvenio, setNewConvenio] = useState<Partial<Convenio>>({ descuento: 0, isActive: true });
  const [newPlan, setNewPlan] = useState<Partial<PlanServicio>>({ isActive: true });

  // Render section content
  const renderContent = () => {
    switch (activeSection) {
      case 'convenios':
        return <ConveniosSection 
          convenios={convenios} 
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAdd={() => setShowAddConvenio(true)}
          onDelete={(id) => {
            setConvenios(convenios.filter(c => c.id !== id));
            toast({ title: "Convenio eliminado" });
          }}
        />;
      case 'gastos':
        return <ExpensesManager />;
      case 'inventario':
        return <InventoryManager />;
      case 'laboratorios':
        return <LabOrdersManager />;
      case 'liquidaciones':
        return <LiquidacionesSection 
          liquidaciones={liquidaciones}
          onFinalize={(id) => {
            setLiquidaciones(liquidaciones.map(l => 
              l.id === id ? { ...l, status: 'finalizada' } : l
            ));
            toast({ title: "Liquidación finalizada" });
          }}
        />;
      case 'fusion':
        return <FusionFichasSection onFusion={() => setShowFusion(true)} />;
      case 'pagos-tpv':
        return <PagosTpvSection />;
      case 'planes':
        return <PlanesServiciosSection 
          planes={planes}
          onAdd={() => setShowAddPlan(true)}
          onToggle={(id) => {
            setPlanes(planes.map(p => 
              p.id === id ? { ...p, isActive: !p.isActive } : p
            ));
          }}
        />;
      case 'arancel':
        return <ArancelPreciosSection aranceles={aranceles} />;
      case 'bancos':
        return <BancosSection />;
      case 'documentos':
        return <DocumentosClinicosSection />;
      case 'consentimientos':
        return <ConsentimientosSection />;
      case 'logotipo':
        return <LogotipoSection />;
      case 'medios-pago':
        return <MediosPagoSection 
          medios={mediosPago}
          onToggle={(id) => {
            setMediosPago(mediosPago.map(m => 
              m.id === id ? { ...m, isActive: !m.isActive } : m
            ));
          }}
        />;
      case 'pagos-anulados':
        return <PagosAnuladosSection />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar Navigation */}
      <div className="w-72 border-r bg-muted/30 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Administración
            </h3>
            {adminSections.map(section => (
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
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{section.label}</p>
                </div>
              </button>
            ))}

            <h3 className="font-semibold text-sm text-muted-foreground mb-3 mt-6 uppercase tracking-wider">
              Configuración
            </h3>
            {configSections.map(section => (
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
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{section.label}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
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

      {/* Add Convenio Dialog */}
      <Dialog open={showAddConvenio} onOpenChange={setShowAddConvenio}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Convenio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empresa *</Label>
              <Input
                value={newConvenio.empresa || ''}
                onChange={(e) => setNewConvenio({ ...newConvenio, empresa: e.target.value })}
                placeholder="Nombre de la empresa"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contacto</Label>
                <Input
                  value={newConvenio.contacto || ''}
                  onChange={(e) => setNewConvenio({ ...newConvenio, contacto: e.target.value })}
                  placeholder="Nombre del contacto"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={newConvenio.telefono || ''}
                  onChange={(e) => setNewConvenio({ ...newConvenio, telefono: e.target.value })}
                  placeholder="+52 555 000 0000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newConvenio.email || ''}
                onChange={(e) => setNewConvenio({ ...newConvenio, email: e.target.value })}
                placeholder="correo@empresa.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newConvenio.descuento || 0}
                onChange={(e) => setNewConvenio({ ...newConvenio, descuento: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddConvenio(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newConvenio.empresa) {
                  toast({ title: "Error", description: "El nombre de empresa es requerido", variant: "destructive" });
                  return;
                }
                const convenio: Convenio = {
                  id: crypto.randomUUID(),
                  empresa: newConvenio.empresa!,
                  contacto: newConvenio.contacto || '',
                  email: newConvenio.email || '',
                  telefono: newConvenio.telefono || '',
                  descuento: newConvenio.descuento || 0,
                  fechaAfiliacion: new Date(),
                  isActive: true,
                  pacientesActivos: 0,
                };
                setConvenios([convenio, ...convenios]);
                setShowAddConvenio(false);
                setNewConvenio({ descuento: 0, isActive: true });
                toast({ title: "Convenio agregado" });
              }}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Plan/Servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  value={newPlan.codigo || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, codigo: e.target.value })}
                  placeholder="SERV-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={newPlan.categoria} onValueChange={(v) => setNewPlan({ ...newPlan, categoria: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {['Diagnóstico', 'Profilaxis', 'Restauración', 'Endodoncia', 'Cirugía', 'Prótesis', 'Ortodoncia', 'Estética', 'Implantología'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre del Servicio *</Label>
              <Input
                value={newPlan.nombre || ''}
                onChange={(e) => setNewPlan({ ...newPlan, nombre: e.target.value })}
                placeholder="Nombre del tratamiento"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio Base (MXN)</Label>
                <Input
                  type="number"
                  value={newPlan.precioBase || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, precioBase: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={newPlan.duracion || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, duracion: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlan(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newPlan.codigo || !newPlan.nombre) {
                  toast({ title: "Error", description: "Código y nombre son requeridos", variant: "destructive" });
                  return;
                }
                const plan: PlanServicio = {
                  id: crypto.randomUUID(),
                  codigo: newPlan.codigo!,
                  nombre: newPlan.nombre!,
                  categoria: newPlan.categoria || 'General',
                  precioBase: newPlan.precioBase || 0,
                  duracion: newPlan.duracion || 30,
                  isActive: true,
                };
                setPlanes([plan, ...planes]);
                setShowAddPlan(false);
                setNewPlan({ isActive: true });
                toast({ title: "Servicio agregado" });
              }}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// === Sub-Sections Components ===

const ConveniosSection = ({ convenios, searchQuery, onSearch, onAdd, onDelete }: {
  convenios: Convenio[];
  searchQuery: string;
  onSearch: (q: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) => {
  const filtered = convenios.filter(c => 
    c.empresa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="w-6 h-6" />
            Convenios Empresariales
          </h2>
          <p className="text-muted-foreground">Gestiona los convenios con empresas y sus descuentos</p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Convenio
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por empresa..."
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Reporte Deudas
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Fecha Afiliación</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Pacientes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((convenio, idx) => (
              <TableRow key={convenio.id}>
                <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                <TableCell className="font-medium">{convenio.empresa}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{convenio.contacto}</p>
                    <p className="text-muted-foreground">{convenio.email}</p>
                  </div>
                </TableCell>
                <TableCell>{format(convenio.fechaAfiliacion, "d MMM yyyy", { locale: es })}</TableCell>
                <TableCell>
                  <Badge variant={convenio.descuento > 0 ? "default" : "secondary"}>
                    {convenio.descuento}%
                  </Badge>
                </TableCell>
                <TableCell>{convenio.pacientesActivos}</TableCell>
                <TableCell>
                  <Badge variant={convenio.isActive ? "default" : "outline"} className={convenio.isActive ? "bg-green-500" : ""}>
                    {convenio.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(convenio.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const LiquidacionesSection = ({ liquidaciones, onFinalize }: {
  liquidaciones: Liquidacion[];
  onFinalize: (id: string) => void;
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          Liquidaciones
        </h2>
        <p className="text-muted-foreground">Nóminas y comisiones de profesionales</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar Todas
        </Button>
        <Button>Finalizar Todas</Button>
      </div>
    </div>

    <Tabs defaultValue="activas">
      <TabsList>
        <TabsTrigger value="activas">Activas</TabsTrigger>
        <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
      </TabsList>
      <TabsContent value="activas" className="mt-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Realizado</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>A Pagar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liquidaciones.filter(l => l.status !== 'finalizada').map(liq => (
                <TableRow key={liq.id}>
                  <TableCell className="font-medium">{liq.profesional}</TableCell>
                  <TableCell>{liq.periodo}</TableCell>
                  <TableCell>${liq.realizado.toLocaleString()}</TableCell>
                  <TableCell>{liq.comision}%</TableCell>
                  <TableCell className="font-bold text-green-600">${liq.aPagar.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={liq.status === 'activa' ? 'default' : 'secondary'}>
                      {liq.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Ver Detalle</Button>
                      <Button size="sm" onClick={() => onFinalize(liq.id)}>Finalizar</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>
      <TabsContent value="finalizadas" className="mt-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay liquidaciones finalizadas en este período
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

const FusionFichasSection = ({ onFusion }: { onFusion: () => void }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <GitMerge className="w-6 h-6" />
        Fusión de Fichas
      </h2>
      <p className="text-muted-foreground">Combinar expedientes de pacientes duplicados</p>
    </div>

    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="py-4">
        <p className="text-sm">
          Ingrese CURP/RFC o nombre del paciente que desea mantener activo (principal) y del paciente que será fusionado (secundario), luego presione el botón Fusionar fichas para realizar la operación.
        </p>
      </CardContent>
    </Card>

    <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardContent className="py-4">
        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
          ⚠️ IMPORTANTE: Una vez realizada la fusión tendrás que confirmar los cambios, ya que estos serán irreversibles.
        </p>
      </CardContent>
    </Card>

    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paciente Principal</CardTitle>
          <CardDescription>Este paciente tendrá toda la información</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>CURP/RFC o Nombre</Label>
            <Input placeholder="Buscar paciente..." className="mt-1" />
          </div>
          <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            Seleccione un paciente
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paciente Secundario</CardTitle>
          <CardDescription>Este paciente quedará deshabilitado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>CURP/RFC o Nombre</Label>
            <Input placeholder="Buscar paciente..." className="mt-1" />
          </div>
          <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            Seleccione un paciente
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="flex justify-center">
      <Button size="lg" className="gap-2">
        <GitMerge className="w-5 h-5" />
        Fusionar Fichas
      </Button>
    </div>
  </div>
);

const PagosTpvSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        Pagos TPV Dentalink
      </h2>
      <p className="text-muted-foreground">Terminal punto de venta integrado</p>
    </div>

    <Card className="border-primary/50">
      <CardContent className="py-8">
        <div className="text-center max-w-md mx-auto">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Cobra desde tu plataforma</h3>
          <p className="text-muted-foreground mb-4">
            Cobra el monto correcto en tu TPV donde quedarán sincronizados todos los pagos de tus pacientes.
          </p>
          <div className="p-4 bg-muted rounded-lg mb-4">
            <p className="text-sm">
              💡 <strong>¿Sabías que</strong> más del 40% de los mexicanos prefieren pagar sus servicios dentales con tarjetas?
            </p>
          </div>
          <Button size="lg">Solicitar Activación</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PlanesServiciosSection = ({ planes, onAdd, onToggle }: {
  planes: PlanServicio[];
  onAdd: () => void;
  onToggle: (id: string) => void;
}) => {
  const categorias = [...new Set(planes.map(p => p.categoria))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListCheck className="w-6 h-6" />
            Planes y Servicios
          </h2>
          <p className="text-muted-foreground">Catálogo de tratamientos y servicios</p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categorias.map(cat => (
          <Card key={cat} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4 text-center">
              <p className="font-medium">{cat}</p>
              <p className="text-2xl font-bold text-primary">{planes.filter(p => p.categoria === cat).length}</p>
              <p className="text-xs text-muted-foreground">servicios</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planes.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="font-mono text-sm">{plan.codigo}</TableCell>
                <TableCell className="font-medium">{plan.nombre}</TableCell>
                <TableCell><Badge variant="secondary">{plan.categoria}</Badge></TableCell>
                <TableCell className="font-semibold">${plan.precioBase.toLocaleString()}</TableCell>
                <TableCell>{plan.duracion} min</TableCell>
                <TableCell>
                  <Switch checked={plan.isActive} onCheckedChange={() => onToggle(plan.id)} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const ArancelPreciosSection = ({ aranceles }: { aranceles: ArancelPrecio[] }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Arancel de Precios
        </h2>
        <p className="text-muted-foreground">Lista base de precios por servicio</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">Plantillas</Button>
        <Button variant="outline">Opciones</Button>
        <Button><Plus className="w-4 h-4 mr-2" />Nuevo Listado</Button>
      </div>
    </div>

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio Normal</TableHead>
            <TableHead>Precio Convenio</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aranceles.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-sm">{a.codigo}</TableCell>
              <TableCell className="font-medium">{a.nombre}</TableCell>
              <TableCell><Badge variant="secondary">{a.categoria}</Badge></TableCell>
              <TableCell className="font-semibold">${a.precio.toLocaleString()}</TableCell>
              <TableCell className="text-green-600">${a.precioConvenio.toLocaleString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

const BancosSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="w-6 h-6" />
        Bancos y Entidades Financieras
      </h2>
      <p className="text-muted-foreground">Configuración de cuentas bancarias</p>
    </div>
    <Card>
      <CardContent className="py-8 text-center">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No hay cuentas bancarias configuradas</p>
        <Button className="mt-4"><Plus className="w-4 h-4 mr-2" />Agregar Banco</Button>
      </CardContent>
    </Card>
  </div>
);

const DocumentosClinicosSection = () => {
  const documentos = [
    { id: '1', nombre: 'Ficha General Dental', estado: 'Habilitada' },
    { id: '2', nombre: 'Expediente Clínico NOM-004-SSA3-2012', estado: 'Habilitada' },
    { id: '3', nombre: 'Historia Clínica', estado: 'Habilitada' },
    { id: '4', nombre: 'Aviso de Privacidad', estado: 'Habilitada' },
    { id: '5', nombre: 'Informed Consent', estado: 'Habilitada' },
    { id: '6', nombre: 'Cuidados postoperatorios exodoncia', estado: 'Habilitada' },
    { id: '7', nombre: 'Recomendaciones pacientes ortodoncia', estado: 'Habilitada' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Documentos Clínicos
          </h2>
          <p className="text-muted-foreground">Plantillas y formatos para expedientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Ver Video</Button>
          <Button><Plus className="w-4 h-4 mr-2" />Nuevo Documento</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map(doc => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.nombre}</TableCell>
                <TableCell><Badge className="bg-green-500">{doc.estado}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Acciones <ChevronRight className="w-4 h-4 ml-1" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                      <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Duplicar documento</DropdownMenuItem>
                      <DropdownMenuItem><XCircle className="w-4 h-4 mr-2" />Deshabilitar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const ConsentimientosSection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6" />
          Consentimientos Informados
        </h2>
        <p className="text-muted-foreground">Plantillas de consentimiento digital</p>
      </div>
      <Button><Plus className="w-4 h-4 mr-2" />Nueva Plantilla</Button>
    </div>

    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="py-4 flex items-center justify-between">
        <p className="text-sm">
          ✍️ Permite a tus pacientes firmar electrónicamente sus consentimientos. Firma segura y proceso 100% digital.
        </p>
        <Button variant="link">Quiero saber más</Button>
      </CardContent>
    </Card>

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">INFORMED CONSENT FOR DENTAL SURGERY</TableCell>
            <TableCell><Badge className="bg-green-500">Habilitada</Badge></TableCell>
            <TableCell>
              <Button variant="outline" size="sm">Acciones</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
);

const LogotipoSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Image className="w-6 h-6" />
        Logotipo
      </h2>
      <p className="text-muted-foreground">Imagen corporativa de la clínica</p>
    </div>

    <Card>
      <CardContent className="py-8 text-center">
        <div className="w-32 h-32 mx-auto mb-4 border-2 border-dashed rounded-lg flex items-center justify-center">
          <Image className="w-12 h-12 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">Arrastra o selecciona una imagen</p>
        <Button><Plus className="w-4 h-4 mr-2" />Subir Logotipo</Button>
      </CardContent>
    </Card>
  </div>
);

const MediosPagoSection = ({ medios, onToggle }: { medios: MedioPago[]; onToggle: (id: string) => void }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PaymentIcon className="w-6 h-6" />
          Opciones de Pago
        </h2>
        <p className="text-muted-foreground">Medios de pago habilitados</p>
      </div>
      <Button><Plus className="w-4 h-4 mr-2" />Nuevo Medio</Button>
    </div>

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medio de Pago</TableHead>
            <TableHead>Retención</TableHead>
            <TableHead>Permite Devolución</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medios.map(medio => (
            <TableRow key={medio.id}>
              <TableCell className="font-medium">{medio.nombre}</TableCell>
              <TableCell>{medio.retencion}%</TableCell>
              <TableCell>{medio.permiteDevoluciones ? 'Sí' : 'No'}</TableCell>
              <TableCell>
                <Switch checked={medio.isActive} onCheckedChange={() => onToggle(medio.id)} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

const PagosAnuladosSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <XCircle className="w-6 h-6" />
        Pagos Anulados y Pendientes
      </h2>
      <p className="text-muted-foreground">Gestión de pagos anulados y cheques</p>
    </div>

    <Tabs defaultValue="anulados">
      <TabsList>
        <TabsTrigger value="anulados">Pagos Anulados</TabsTrigger>
        <TabsTrigger value="cheques">Gestión de Cheques</TabsTrigger>
        <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
      </TabsList>
      <TabsContent value="anulados" className="mt-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay pagos anulados para mostrar
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="cheques" className="mt-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay cheques pendientes
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="devoluciones" className="mt-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay devoluciones registradas
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);
