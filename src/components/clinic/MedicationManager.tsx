import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, Search, Plus, Package, AlertTriangle, TrendingDown, TrendingUp,
  Edit2, Trash2, ShoppingCart, Calendar, FileText, AlertCircle, Check,
  X, Filter, Download, Upload, RefreshCw, Printer, BarChart3, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  presentation: string;
  dosage: string;
  manufacturer: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  expirationDate: string;
  batchNumber: string;
  location: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired';
  contraindications: string[];
  interactions: string[];
  sideEffects: string[];
  instructions: string;
}

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  medications: {
    medicationId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }[];
  diagnosis: string;
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation: string;
}

// Drug interactions database
const DRUG_INTERACTIONS: DrugInteraction[] = [
  { drug1: "Warfarina", drug2: "Aspirina", severity: "major", description: "Riesgo aumentado de sangrado", recommendation: "Evitar uso concomitante o monitorear INR frecuentemente" },
  { drug1: "Ibuprofeno", drug2: "Aspirina", severity: "moderate", description: "Puede reducir el efecto antiagregante de la aspirina", recommendation: "Administrar aspirina 30 min antes del ibuprofeno" },
  { drug1: "Amoxicilina", drug2: "Metformina", severity: "minor", description: "Posible alteración de la absorción", recommendation: "Separar administración por 2 horas" },
  { drug1: "Ketorolaco", drug2: "Warfarina", severity: "contraindicated", description: "Riesgo muy alto de hemorragia", recommendation: "Uso contraindicado, buscar alternativa" },
  { drug1: "Lidocaína", drug2: "Propranolol", severity: "moderate", description: "Aumento de niveles de lidocaína", recommendation: "Reducir dosis de lidocaína un 30%" },
  { drug1: "Metronidazol", drug2: "Warfarina", severity: "major", description: "Potenciación del efecto anticoagulante", recommendation: "Monitorear INR y ajustar dosis" },
  { drug1: "Clindamicina", drug2: "Eritromicina", severity: "major", description: "Antagonismo bacteriológico", recommendation: "No combinar, elegir uno u otro" },
];

const MEDICATION_CATEGORIES = [
  "Analgésicos",
  "Antiinflamatorios",
  "Antibióticos",
  "Anestésicos",
  "Antisépticos",
  "Anticoagulantes",
  "Corticosteroides",
  "Antimicóticos",
  "Materiales dentales",
  "Otros"
];

const SAMPLE_MEDICATIONS: Medication[] = [
  {
    id: "1", name: "Amoxicilina 500mg", genericName: "Amoxicilina", category: "Antibióticos",
    presentation: "Cápsulas", dosage: "500mg", manufacturer: "Lab Bayer", stock: 150, minStock: 50,
    maxStock: 300, unitPrice: 2.50, expirationDate: "2025-06-15", batchNumber: "LOT-2024-001",
    location: "Estante A-1", status: "available",
    contraindications: ["Alergia a penicilinas", "Mononucleosis"],
    interactions: ["Metformina", "Anticoagulantes orales"],
    sideEffects: ["Náuseas", "Diarrea", "Erupciones cutáneas"],
    instructions: "Tomar cada 8 horas con o sin alimentos"
  },
  {
    id: "2", name: "Ibuprofeno 400mg", genericName: "Ibuprofeno", category: "Antiinflamatorios",
    presentation: "Tabletas", dosage: "400mg", manufacturer: "Pfizer", stock: 30, minStock: 40,
    maxStock: 200, unitPrice: 1.20, expirationDate: "2025-03-20", batchNumber: "LOT-2024-002",
    location: "Estante B-2", status: "low_stock",
    contraindications: ["Úlcera gástrica", "Insuficiencia renal", "Embarazo tercer trimestre"],
    interactions: ["Aspirina", "Warfarina", "Litio"],
    sideEffects: ["Dolor estomacal", "Mareos", "Retención de líquidos"],
    instructions: "Tomar después de las comidas"
  },
  {
    id: "3", name: "Lidocaína 2%", genericName: "Lidocaína", category: "Anestésicos",
    presentation: "Ampolla", dosage: "2%", manufacturer: "Astra", stock: 0, minStock: 20,
    maxStock: 100, unitPrice: 5.00, expirationDate: "2024-12-01", batchNumber: "LOT-2023-100",
    location: "Refrigerador", status: "out_of_stock",
    contraindications: ["Alergia a anestésicos locales", "Bloqueo cardíaco"],
    interactions: ["Propranolol", "Cimetidina"],
    sideEffects: ["Adormecimiento prolongado", "Mareos"],
    instructions: "Solo uso profesional"
  },
  {
    id: "4", name: "Clindamicina 300mg", genericName: "Clindamicina", category: "Antibióticos",
    presentation: "Cápsulas", dosage: "300mg", manufacturer: "Pfizer", stock: 80, minStock: 30,
    maxStock: 150, unitPrice: 4.50, expirationDate: "2025-09-10", batchNumber: "LOT-2024-015",
    location: "Estante A-2", status: "available",
    contraindications: ["Colitis pseudomembranosa", "Alergia a lincosamidas"],
    interactions: ["Eritromicina", "Relajantes musculares"],
    sideEffects: ["Diarrea", "Colitis", "Náuseas"],
    instructions: "Tomar con abundante agua"
  },
  {
    id: "5", name: "Ketorolaco 10mg", genericName: "Ketorolaco", category: "Analgésicos",
    presentation: "Tabletas", dosage: "10mg", manufacturer: "Roche", stock: 100, minStock: 40,
    maxStock: 200, unitPrice: 3.00, expirationDate: "2024-11-30", batchNumber: "LOT-2024-020",
    location: "Estante B-1", status: "available",
    contraindications: ["Úlcera péptica", "Insuficiencia renal", "Sangrado GI"],
    interactions: ["Warfarina", "Metotrexato", "Litio"],
    sideEffects: ["Dispepsia", "Náuseas", "Edema"],
    instructions: "No usar más de 5 días consecutivos"
  }
];

const SAMPLE_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-001",
    patientName: "María García López",
    patientId: "PAT-001",
    doctorName: "Dr. Carlos Mendoza",
    date: "2024-01-15",
    medications: [
      { medicationId: "1", medicationName: "Amoxicilina 500mg", dosage: "500mg", frequency: "Cada 8 horas", duration: "7 días", quantity: 21, instructions: "Tomar con alimentos" },
      { medicationId: "5", medicationName: "Ketorolaco 10mg", dosage: "10mg", frequency: "Cada 8 horas por dolor", duration: "3 días", quantity: 9, instructions: "Solo si hay dolor" }
    ],
    diagnosis: "Absceso dental pieza 36",
    notes: "Verificar alergias antes de dispensar",
    status: "active"
  }
];

export const MedicationManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [medications, setMedications] = useState<Medication[]>(SAMPLE_MEDICATIONS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(SAMPLE_PRESCRIPTIONS);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);
  const [interactionCheckDrugs, setInteractionCheckDrugs] = useState<string[]>([]);
  const [showInteractionResults, setShowInteractionResults] = useState(false);

  // New medication form
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: "", genericName: "", category: "", presentation: "", dosage: "",
    manufacturer: "", stock: 0, minStock: 0, maxStock: 100, unitPrice: 0,
    expirationDate: "", batchNumber: "", location: "", contraindications: [],
    interactions: [], sideEffects: [], instructions: ""
  });

  // New prescription form
  const [newPrescription, setNewPrescription] = useState<Partial<Prescription>>({
    patientName: "", patientId: "", doctorName: "", diagnosis: "", notes: "",
    medications: []
  });

  // Stats
  const stats = useMemo(() => ({
    totalItems: medications.length,
    lowStock: medications.filter(m => m.status === 'low_stock').length,
    outOfStock: medications.filter(m => m.status === 'out_of_stock').length,
    expiringSoon: medications.filter(m => {
      const exp = new Date(m.expirationDate);
      const now = new Date();
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 90 && diff > 0;
    }).length,
    totalValue: medications.reduce((sum, m) => sum + (m.stock * m.unitPrice), 0)
  }), [medications]);

  // Filtered medications
  const filteredMedications = useMemo(() => {
    return medications.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.genericName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [medications, searchQuery, categoryFilter]);

  // Check interactions
  const checkInteractions = () => {
    const foundInteractions: DrugInteraction[] = [];
    for (let i = 0; i < interactionCheckDrugs.length; i++) {
      for (let j = i + 1; j < interactionCheckDrugs.length; j++) {
        const interaction = DRUG_INTERACTIONS.find(int =>
          (int.drug1.toLowerCase().includes(interactionCheckDrugs[i].toLowerCase()) &&
           int.drug2.toLowerCase().includes(interactionCheckDrugs[j].toLowerCase())) ||
          (int.drug1.toLowerCase().includes(interactionCheckDrugs[j].toLowerCase()) &&
           int.drug2.toLowerCase().includes(interactionCheckDrugs[i].toLowerCase()))
        );
        if (interaction) foundInteractions.push(interaction);
      }
    }
    return foundInteractions;
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.category) {
      toast({ title: "Error", description: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    const medication: Medication = {
      id: `MED-${Date.now()}`,
      name: newMedication.name || "",
      genericName: newMedication.genericName || "",
      category: newMedication.category || "",
      presentation: newMedication.presentation || "",
      dosage: newMedication.dosage || "",
      manufacturer: newMedication.manufacturer || "",
      stock: newMedication.stock || 0,
      minStock: newMedication.minStock || 0,
      maxStock: newMedication.maxStock || 100,
      unitPrice: newMedication.unitPrice || 0,
      expirationDate: newMedication.expirationDate || "",
      batchNumber: newMedication.batchNumber || "",
      location: newMedication.location || "",
      status: (newMedication.stock || 0) === 0 ? 'out_of_stock' : 
              (newMedication.stock || 0) <= (newMedication.minStock || 0) ? 'low_stock' : 'available',
      contraindications: newMedication.contraindications || [],
      interactions: newMedication.interactions || [],
      sideEffects: newMedication.sideEffects || [],
      instructions: newMedication.instructions || ""
    };

    setMedications([...medications, medication]);
    setIsAddingMedication(false);
    setNewMedication({});
    toast({ title: "Medicamento agregado", description: `${medication.name} ha sido registrado` });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'low_stock': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'out_of_stock': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'expired': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-blue-500/10 text-blue-500';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-500';
      case 'major': return 'bg-orange-500/10 text-orange-500';
      case 'contraindicated': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agotados</p>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Gestión de Medicamentos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddingMedication(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Medicamento
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingPrescription(true)} className="gap-2">
                <FileText className="w-4 h-4" />
                Nueva Receta
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="prescriptions">Recetas</TabsTrigger>
              <TabsTrigger value="interactions">Interacciones</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar medicamento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {MEDICATION_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Medications Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedications.map((med) => (
                      <TableRow key={med.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMedication(med)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">{med.genericName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{med.category}</Badge>
                        </TableCell>
                        <TableCell>{med.presentation}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{med.stock} / {med.maxStock}</p>
                            <Progress value={(med.stock / med.maxStock) * 100} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>${med.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{new Date(med.expirationDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(med.status)}>
                            {med.status === 'available' ? 'Disponible' :
                             med.status === 'low_stock' ? 'Stock Bajo' :
                             med.status === 'out_of_stock' ? 'Agotado' : 'Vencido'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Receta</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Medicamentos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell className="font-mono">{rx.id}</TableCell>
                        <TableCell>{rx.patientName}</TableCell>
                        <TableCell>{rx.doctorName}</TableCell>
                        <TableCell>{new Date(rx.date).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rx.medications.map((m, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{m.medicationName}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={rx.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted'}>
                            {rx.status === 'active' ? 'Activa' : rx.status === 'completed' ? 'Completada' : 'Cancelada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Verificador de Interacciones Medicamentosas
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ingrese los medicamentos para verificar posibles interacciones
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {interactionCheckDrugs.map((drug, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-2 py-1.5">
                          {drug}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setInteractionCheckDrugs(interactionCheckDrugs.filter((_, i) => i !== idx))} />
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select onValueChange={(val) => {
                        if (!interactionCheckDrugs.includes(val)) {
                          setInteractionCheckDrugs([...interactionCheckDrugs, val]);
                        }
                      }}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Agregar medicamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {medications.map(m => (
                            <SelectItem key={m.id} value={m.genericName}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setShowInteractionResults(true)} disabled={interactionCheckDrugs.length < 2}>
                        Verificar
                      </Button>
                    </div>

                    {showInteractionResults && interactionCheckDrugs.length >= 2 && (
                      <div className="mt-4 space-y-3">
                        {checkInteractions().length === 0 ? (
                          <Alert>
                            <Check className="w-4 h-4" />
                            <AlertTitle>Sin interacciones detectadas</AlertTitle>
                            <AlertDescription>
                              No se encontraron interacciones conocidas entre los medicamentos seleccionados.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          checkInteractions().map((int, idx) => (
                            <Alert key={idx} variant={int.severity === 'contraindicated' || int.severity === 'major' ? 'destructive' : 'default'}>
                              <AlertTriangle className="w-4 h-4" />
                              <AlertTitle className="flex items-center gap-2">
                                {int.drug1} + {int.drug2}
                                <Badge className={getSeverityColor(int.severity)}>
                                  {int.severity === 'minor' ? 'Menor' :
                                   int.severity === 'moderate' ? 'Moderada' :
                                   int.severity === 'major' ? 'Mayor' : 'Contraindicado'}
                                </Badge>
                              </AlertTitle>
                              <AlertDescription>
                                <p className="mt-1">{int.description}</p>
                                <p className="mt-2 font-medium">Recomendación: {int.recommendation}</p>
                              </AlertDescription>
                            </Alert>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {stats.outOfStock > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Productos Agotados</AlertTitle>
                  <AlertDescription>
                    {medications.filter(m => m.status === 'out_of_stock').map(m => m.name).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {stats.lowStock > 0 && (
                <Alert>
                  <TrendingDown className="w-4 h-4" />
                  <AlertTitle>Stock Bajo</AlertTitle>
                  <AlertDescription>
                    {medications.filter(m => m.status === 'low_stock').map(m => `${m.name} (${m.stock} unidades)`).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {stats.expiringSoon > 0 && (
                <Alert>
                  <Calendar className="w-4 h-4" />
                  <AlertTitle>Próximos a Vencer (90 días)</AlertTitle>
                  <AlertDescription>
                    {medications.filter(m => {
                      const exp = new Date(m.expirationDate);
                      const now = new Date();
                      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                      return diff <= 90 && diff > 0;
                    }).map(m => `${m.name} (${new Date(m.expirationDate).toLocaleDateString('es-MX')})`).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {stats.outOfStock === 0 && stats.lowStock === 0 && stats.expiringSoon === 0 && (
                <Alert>
                  <Check className="w-4 h-4" />
                  <AlertTitle>Todo en orden</AlertTitle>
                  <AlertDescription>No hay alertas activas en este momento.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Medication Detail Dialog */}
      <Dialog open={!!selectedMedication} onOpenChange={() => setSelectedMedication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMedication && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMedication.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre Genérico</Label>
                    <p className="font-medium">{selectedMedication.genericName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoría</Label>
                    <p className="font-medium">{selectedMedication.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Presentación</Label>
                    <p className="font-medium">{selectedMedication.presentation} - {selectedMedication.dosage}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fabricante</Label>
                    <p className="font-medium">{selectedMedication.manufacturer}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stock</Label>
                    <p className="font-medium">{selectedMedication.stock} unidades</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Precio Unitario</Label>
                    <p className="font-medium">${selectedMedication.unitPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lote</Label>
                    <p className="font-medium">{selectedMedication.batchNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vencimiento</Label>
                    <p className="font-medium">{new Date(selectedMedication.expirationDate).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>

                {selectedMedication.contraindications.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Contraindicaciones</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMedication.contraindications.map((c, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMedication.interactions.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Interacciones Conocidas</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMedication.interactions.map((i, idx) => (
                        <Badge key={idx} className="bg-yellow-500/10 text-yellow-500 text-xs">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMedication.sideEffects.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Efectos Secundarios</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMedication.sideEffects.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Instrucciones</Label>
                  <p className="text-sm mt-1">{selectedMedication.instructions}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={isAddingMedication} onOpenChange={setIsAddingMedication}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Medicamento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre Comercial *</Label>
              <Input value={newMedication.name} onChange={(e) => setNewMedication({...newMedication, name: e.target.value})} />
            </div>
            <div>
              <Label>Nombre Genérico</Label>
              <Input value={newMedication.genericName} onChange={(e) => setNewMedication({...newMedication, genericName: e.target.value})} />
            </div>
            <div>
              <Label>Categoría *</Label>
              <Select value={newMedication.category} onValueChange={(val) => setNewMedication({...newMedication, category: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEDICATION_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Presentación</Label>
              <Input value={newMedication.presentation} onChange={(e) => setNewMedication({...newMedication, presentation: e.target.value})} placeholder="Tabletas, Cápsulas, Ampolla..." />
            </div>
            <div>
              <Label>Dosis</Label>
              <Input value={newMedication.dosage} onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})} placeholder="500mg, 2%, etc." />
            </div>
            <div>
              <Label>Fabricante</Label>
              <Input value={newMedication.manufacturer} onChange={(e) => setNewMedication({...newMedication, manufacturer: e.target.value})} />
            </div>
            <div>
              <Label>Stock Inicial</Label>
              <Input type="number" value={newMedication.stock} onChange={(e) => setNewMedication({...newMedication, stock: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <Label>Stock Mínimo</Label>
              <Input type="number" value={newMedication.minStock} onChange={(e) => setNewMedication({...newMedication, minStock: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <Label>Stock Máximo</Label>
              <Input type="number" value={newMedication.maxStock} onChange={(e) => setNewMedication({...newMedication, maxStock: parseInt(e.target.value) || 100})} />
            </div>
            <div>
              <Label>Precio Unitario</Label>
              <Input type="number" step="0.01" value={newMedication.unitPrice} onChange={(e) => setNewMedication({...newMedication, unitPrice: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input type="date" value={newMedication.expirationDate} onChange={(e) => setNewMedication({...newMedication, expirationDate: e.target.value})} />
            </div>
            <div>
              <Label>Número de Lote</Label>
              <Input value={newMedication.batchNumber} onChange={(e) => setNewMedication({...newMedication, batchNumber: e.target.value})} />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input value={newMedication.location} onChange={(e) => setNewMedication({...newMedication, location: e.target.value})} placeholder="Estante A-1, Refrigerador..." />
            </div>
            <div className="col-span-2">
              <Label>Instrucciones de Uso</Label>
              <Textarea value={newMedication.instructions} onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMedication(false)}>Cancelar</Button>
            <Button onClick={handleAddMedication}>Guardar Medicamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prescription Dialog */}
      <Dialog open={isCreatingPrescription} onOpenChange={setIsCreatingPrescription}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Receta Médica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Input placeholder="Nombre del paciente" value={newPrescription.patientName} onChange={(e) => setNewPrescription({...newPrescription, patientName: e.target.value})} />
              </div>
              <div>
                <Label>Doctor *</Label>
                <Input placeholder="Nombre del doctor" value={newPrescription.doctorName} onChange={(e) => setNewPrescription({...newPrescription, doctorName: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Diagnóstico</Label>
              <Textarea value={newPrescription.diagnosis} onChange={(e) => setNewPrescription({...newPrescription, diagnosis: e.target.value})} />
            </div>
            <div>
              <Label>Notas Adicionales</Label>
              <Textarea value={newPrescription.notes} onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingPrescription(false)}>Cancelar</Button>
            <Button>Generar Receta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
