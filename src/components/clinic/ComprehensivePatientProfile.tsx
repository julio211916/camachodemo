import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, FileText, Stethoscope, Box, Heart, CreditCard,
  Phone, Mail, MapPin, Clock, Activity, TrendingUp, AlertTriangle,
  ChevronLeft, Printer, Download, Edit2, Save, X, Plus, Camera,
  QrCode, History, Pill, Layers, Image as ImageIcon, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Import clinic modules
import { EnhancedOdontogram } from "./EnhancedOdontogram";
import { Dental3DViewer } from "./Dental3DViewer";
import { MedicalHistory } from "./MedicalHistory";
import { InteractiveOdontogram } from "./InteractiveOdontogram";

interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  avatarUrl?: string;
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  tags: string[];
  notes: string;
  createdAt: string;
  lastVisit?: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  cost: number;
  paidAmount: number;
  doctorName: string;
  notes: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  service: string;
  doctor: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  items: { description: string; amount: number }[];
}

// Sample data
const SAMPLE_PATIENT: PatientProfile = {
  id: "PAT-001",
  userId: "user-001",
  fullName: "María García López",
  email: "maria.garcia@email.com",
  phone: "+52 55 1234 5678",
  dateOfBirth: "1985-03-15",
  gender: "Femenino",
  address: "Av. Reforma 123, Col. Centro, CDMX",
  bloodType: "O+",
  allergies: ["Penicilina", "Látex"],
  conditions: ["Hipertensión controlada"],
  medications: ["Losartán 50mg"],
  emergencyContact: {
    name: "Carlos García",
    phone: "+52 55 9876 5432",
    relationship: "Esposo"
  },
  insuranceInfo: {
    provider: "Seguros GNP",
    policyNumber: "POL-123456",
    groupNumber: "GRP-789"
  },
  tags: ["VIP", "Ortodoncia"],
  notes: "Paciente muy puntual. Prefiere citas por la mañana.",
  createdAt: "2022-01-15",
  lastVisit: "2024-01-10"
};

const SAMPLE_TREATMENTS: Treatment[] = [
  { id: "TRT-001", name: "Ortodoncia completa", description: "Tratamiento de brackets metálicos", status: "in_progress", startDate: "2023-06-01", cost: 45000, paidAmount: 30000, doctorName: "Dr. Carlos Mendoza", notes: "Progreso satisfactorio" },
  { id: "TRT-002", name: "Limpieza dental", description: "Profilaxis profunda", status: "completed", startDate: "2024-01-10", endDate: "2024-01-10", cost: 1500, paidAmount: 1500, doctorName: "Dra. Ana Ruiz", notes: "" },
  { id: "TRT-003", name: "Blanqueamiento", description: "Blanqueamiento láser", status: "planned", startDate: "2024-02-15", cost: 8000, paidAmount: 0, doctorName: "Dr. Carlos Mendoza", notes: "Programado para después de ortodoncia" },
];

const SAMPLE_APPOINTMENTS: Appointment[] = [
  { id: "APT-001", date: "2024-01-25", time: "10:00", service: "Control de ortodoncia", doctor: "Dr. Carlos Mendoza", status: "confirmed" },
  { id: "APT-002", date: "2024-02-15", time: "11:30", service: "Blanqueamiento", doctor: "Dr. Carlos Mendoza", status: "pending" },
  { id: "APT-003", date: "2024-01-10", time: "09:00", service: "Limpieza dental", doctor: "Dra. Ana Ruiz", status: "completed" },
];

const SAMPLE_INVOICES: Invoice[] = [
  { id: "INV-001", number: "F-2024-0125", date: "2024-01-10", total: 1500, status: "paid", items: [{ description: "Limpieza dental profesional", amount: 1500 }] },
  { id: "INV-002", number: "F-2024-0089", date: "2023-12-15", total: 15000, status: "paid", items: [{ description: "Mensualidad ortodoncia (Dic)", amount: 15000 }] },
  { id: "INV-003", number: "F-2024-0156", date: "2024-01-25", total: 15000, status: "pending", items: [{ description: "Mensualidad ortodoncia (Ene)", amount: 15000 }] },
];

interface ComprehensivePatientProfileProps {
  patientId?: string;
  onBack?: () => void;
}

export const ComprehensivePatientProfile = ({ patientId, onBack }: ComprehensivePatientProfileProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [patient] = useState<PatientProfile>(SAMPLE_PATIENT);
  const [treatments] = useState<Treatment[]>(SAMPLE_TREATMENTS);
  const [appointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS);
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTreatmentCost = treatments.reduce((sum, t) => sum + t.cost, 0);
    const totalPaid = treatments.reduce((sum, t) => sum + t.paidAmount, 0);
    const upcomingAppts = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const completedAppts = appointments.filter(a => a.status === 'completed').length;
    const pendingBalance = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);

    return {
      totalTreatmentCost,
      totalPaid,
      balance: totalTreatmentCost - totalPaid,
      upcomingAppts,
      completedAppts,
      pendingBalance,
      paymentProgress: totalTreatmentCost > 0 ? (totalPaid / totalTreatmentCost) * 100 : 0
    };
  }, [treatments, appointments, invoices]);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress': case 'confirmed': case 'partial': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': case 'planned': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completado', paid: 'Pagado', in_progress: 'En Progreso',
      confirmed: 'Confirmada', partial: 'Parcial', pending: 'Pendiente',
      planned: 'Planificado', cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={patient.avatarUrl} />
              <AvatarFallback className="text-xl bg-primary/10">
                {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{patient.fullName}</h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {getAge(patient.dateOfBirth)} años
                </span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Última visita: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('es-MX') : 'N/A'}
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                {patient.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <QrCode className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Próximas</p>
                <p className="text-2xl font-bold">{stats.upcomingAppts}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tratamientos</p>
                <p className="text-2xl font-bold">{treatments.filter(t => t.status === 'in_progress').length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pagado</p>
                <p className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                <p className="text-2xl font-bold">${stats.pendingBalance.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso Pago</p>
                <p className="text-2xl font-bold">{stats.paymentProgress.toFixed(0)}%</p>
              </div>
              <Progress value={stats.paymentProgress} className="w-16 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(patient.allergies.length > 0 || patient.conditions.length > 0) && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                {patient.allergies.length > 0 && (
                  <div>
                    <span className="font-medium text-yellow-500">Alergias: </span>
                    {patient.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive" className="ml-1">{a}</Badge>
                    ))}
                  </div>
                )}
                {patient.conditions.length > 0 && (
                  <div>
                    <span className="font-medium text-yellow-500">Condiciones: </span>
                    {patient.conditions.map((c, i) => (
                      <Badge key={i} className="ml-1 bg-yellow-500/10 text-yellow-500">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="h-12 w-full justify-start gap-2 bg-transparent">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-muted">
                  <User className="w-4 h-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="odontogram" className="gap-2 data-[state=active]:bg-muted">
                  <Stethoscope className="w-4 h-4" />
                  Odontograma
                </TabsTrigger>
                <TabsTrigger value="3d-viewer" className="gap-2 data-[state=active]:bg-muted">
                  <Box className="w-4 h-4" />
                  Visor 3D
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-2 data-[state=active]:bg-muted">
                  <Heart className="w-4 h-4" />
                  Historia Clínica
                </TabsTrigger>
                <TabsTrigger value="treatments" className="gap-2 data-[state=active]:bg-muted">
                  <Activity className="w-4 h-4" />
                  Tratamientos
                </TabsTrigger>
                <TabsTrigger value="appointments" className="gap-2 data-[state=active]:bg-muted">
                  <Calendar className="w-4 h-4" />
                  Citas
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-muted">
                  <CreditCard className="w-4 h-4" />
                  Facturación
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-muted">
                  <FileText className="w-4 h-4" />
                  Documentos
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{patient.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{patient.phone}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{patient.address}</span>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Contacto de Emergencia</p>
                        {patient.emergencyContact && (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{patient.emergencyContact.name}</p>
                            <p>{patient.emergencyContact.phone}</p>
                            <p>{patient.emergencyContact.relationship}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Médica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tipo de Sangre</span>
                        <Badge variant="outline">{patient.bloodType || 'N/A'}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Medicamentos Actuales</p>
                        <div className="flex flex-wrap gap-1">
                          {patient.medications.map((m, i) => (
                            <Badge key={i} variant="secondary">{m}</Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Seguro Médico</p>
                        {patient.insuranceInfo && (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{patient.insuranceInfo.provider}</p>
                            <p>Póliza: {patient.insuranceInfo.policyNumber}</p>
                            <p>Grupo: {patient.insuranceInfo.groupNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        Notas
                        <Button variant="ghost" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{patient.notes || 'Sin notas'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointments.slice(0, 5).map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              apt.status === 'completed' ? 'bg-green-500/10' : 'bg-primary/10'
                            }`}>
                              <Calendar className={`w-5 h-5 ${apt.status === 'completed' ? 'text-green-500' : 'text-primary'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{apt.service}</p>
                              <p className="text-sm text-muted-foreground">{apt.doctor} • {new Date(apt.date).toLocaleDateString('es-MX')}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(apt.status)}>{getStatusLabel(apt.status)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="odontogram" className="mt-0">
                <EnhancedOdontogram patientId={patient.id} />
              </TabsContent>

              <TabsContent value="3d-viewer" className="mt-0">
                <Dental3DViewer />
              </TabsContent>

              <TabsContent value="medical" className="mt-0">
                <MedicalHistory patientId={patient.id} />
              </TabsContent>

              <TabsContent value="treatments" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Historial de Tratamientos</h3>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Tratamiento
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Pagado</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {treatments.map((t) => (
                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>{t.doctorName}</TableCell>
                          <TableCell>{new Date(t.startDate).toLocaleDateString('es-MX')}</TableCell>
                          <TableCell>${t.cost.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span>${t.paidAmount.toLocaleString()}</span>
                              <Progress value={(t.paidAmount / t.cost) * 100} className="h-1.5 w-16" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(t.status)}>{getStatusLabel(t.status)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="appointments" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Historial de Citas</h3>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Cita
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell>{new Date(apt.date).toLocaleDateString('es-MX')}</TableCell>
                          <TableCell>{apt.time}</TableCell>
                          <TableCell>{apt.service}</TableCell>
                          <TableCell>{apt.doctor}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(apt.status)}>{getStatusLabel(apt.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{apt.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Historial de Facturación</h3>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Factura
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Factura</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono">{inv.number}</TableCell>
                          <TableCell>{new Date(inv.date).toLocaleDateString('es-MX')}</TableCell>
                          <TableCell>
                            {inv.items.map((item, i) => (
                              <span key={i} className="text-sm">{item.description}</span>
                            ))}
                          </TableCell>
                          <TableCell className="font-medium">${inv.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(inv.status)}>{getStatusLabel(inv.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon">
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Documentos del Paciente</h3>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Subir Documento
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Radiografías', 'Fotografías', 'Consentimientos', 'Recetas', 'Estudios', 'Otros'].map((cat) => (
                    <Card key={cat} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-medium">{cat}</p>
                        <p className="text-xs text-muted-foreground">0 archivos</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
