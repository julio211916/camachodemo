import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Plus, Trash2, Calculator, Calendar, FileText, Download,
  Printer, Send, DollarSign, Clock, CheckCircle2, AlertTriangle, Users,
  Stethoscope, ChevronRight, ChevronDown, Edit2, Copy, Save, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addWeeks } from "date-fns";
import { es } from "date-fns/locale";

// Treatment categories with procedures
interface Procedure {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  estimatedDuration: number; // in minutes
  complexity: 'simple' | 'moderate' | 'complex';
  requiresFollowUp: boolean;
  followUpDays?: number;
  description: string;
}

interface TreatmentPlanItem {
  id: string;
  procedureId: string;
  procedureName: string;
  toothNumber?: string;
  quadrant?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  scheduledDate?: string;
  estimatedDuration: number;
}

interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  diagnosis: string;
  observations: string;
  items: TreatmentPlanItem[];
  subtotal: number;
  discountTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Dental procedures catalog
const PROCEDURES_CATALOG: Procedure[] = [
  // Preventive
  { id: "prev-001", name: "Limpieza Dental Profesional", category: "Preventivo", basePrice: 800, estimatedDuration: 45, complexity: "simple", requiresFollowUp: true, followUpDays: 180, description: "Profilaxis dental completa con ultrasonido" },
  { id: "prev-002", name: "Aplicación de Flúor", category: "Preventivo", basePrice: 300, estimatedDuration: 15, complexity: "simple", requiresFollowUp: false, description: "Aplicación tópica de flúor en gel o barniz" },
  { id: "prev-003", name: "Selladores de Fosetas", category: "Preventivo", basePrice: 400, estimatedDuration: 20, complexity: "simple", requiresFollowUp: true, followUpDays: 365, description: "Sellador por pieza dental" },
  
  // Restorative
  { id: "rest-001", name: "Resina Simple", category: "Restaurativo", basePrice: 900, estimatedDuration: 45, complexity: "simple", requiresFollowUp: false, description: "Restauración con resina compuesta (1 superficie)" },
  { id: "rest-002", name: "Resina Compuesta", category: "Restaurativo", basePrice: 1200, estimatedDuration: 60, complexity: "moderate", requiresFollowUp: false, description: "Restauración con resina compuesta (2-3 superficies)" },
  { id: "rest-003", name: "Resina Compleja", category: "Restaurativo", basePrice: 1500, estimatedDuration: 75, complexity: "complex", requiresFollowUp: true, followUpDays: 30, description: "Restauración extensa con resina" },
  { id: "rest-004", name: "Amalgama", category: "Restaurativo", basePrice: 600, estimatedDuration: 40, complexity: "simple", requiresFollowUp: false, description: "Restauración con amalgama de plata" },
  { id: "rest-005", name: "Incrustación Cerámica", category: "Restaurativo", basePrice: 4500, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Inlay/Onlay de porcelana" },
  
  // Endodontics
  { id: "endo-001", name: "Endodoncia Anterior", category: "Endodoncia", basePrice: 3500, estimatedDuration: 90, complexity: "moderate", requiresFollowUp: true, followUpDays: 14, description: "Tratamiento de conductos en diente anterior" },
  { id: "endo-002", name: "Endodoncia Premolar", category: "Endodoncia", basePrice: 4500, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Tratamiento de conductos en premolar" },
  { id: "endo-003", name: "Endodoncia Molar", category: "Endodoncia", basePrice: 6000, estimatedDuration: 150, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Tratamiento de conductos en molar" },
  { id: "endo-004", name: "Retratamiento Endodóntico", category: "Endodoncia", basePrice: 7000, estimatedDuration: 180, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Retratamiento de conductos" },
  
  // Periodontics
  { id: "perio-001", name: "Raspado y Alisado Radicular", category: "Periodoncia", basePrice: 2500, estimatedDuration: 60, complexity: "moderate", requiresFollowUp: true, followUpDays: 30, description: "Por cuadrante" },
  { id: "perio-002", name: "Curetaje", category: "Periodoncia", basePrice: 1800, estimatedDuration: 45, complexity: "moderate", requiresFollowUp: true, followUpDays: 14, description: "Curetaje abierto por sextante" },
  { id: "perio-003", name: "Cirugía Periodontal", category: "Periodoncia", basePrice: 8000, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Procedimiento quirúrgico periodontal" },
  
  // Oral Surgery
  { id: "ciru-001", name: "Extracción Simple", category: "Cirugía", basePrice: 800, estimatedDuration: 30, complexity: "simple", requiresFollowUp: true, followUpDays: 7, description: "Extracción de pieza dental erupcionada" },
  { id: "ciru-002", name: "Extracción Quirúrgica", category: "Cirugía", basePrice: 2500, estimatedDuration: 60, complexity: "moderate", requiresFollowUp: true, followUpDays: 7, description: "Extracción que requiere colgajo" },
  { id: "ciru-003", name: "Extracción de Terceros Molares", category: "Cirugía", basePrice: 4000, estimatedDuration: 90, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Extracción de muelas del juicio" },
  { id: "ciru-004", name: "Frenectomía", category: "Cirugía", basePrice: 3000, estimatedDuration: 45, complexity: "moderate", requiresFollowUp: true, followUpDays: 14, description: "Eliminación de frenillo" },
  
  // Prosthetics
  { id: "prot-001", name: "Corona de Porcelana", category: "Prótesis", basePrice: 6000, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Corona metal-porcelana o libre de metal" },
  { id: "prot-002", name: "Corona de Zirconia", category: "Prótesis", basePrice: 8000, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Corona de zirconia monolítica" },
  { id: "prot-003", name: "Puente Fijo (por pieza)", category: "Prótesis", basePrice: 5500, estimatedDuration: 150, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Cada unidad del puente" },
  { id: "prot-004", name: "Prótesis Parcial Removible", category: "Prótesis", basePrice: 8000, estimatedDuration: 180, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Prótesis parcial acrílica" },
  { id: "prot-005", name: "Prótesis Total", category: "Prótesis", basePrice: 12000, estimatedDuration: 240, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Dentadura completa" },
  { id: "prot-006", name: "Carilla de Porcelana", category: "Prótesis", basePrice: 7000, estimatedDuration: 90, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Carilla dental estética" },
  
  // Implants
  { id: "impl-001", name: "Implante Dental", category: "Implantes", basePrice: 18000, estimatedDuration: 90, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Colocación de implante dental" },
  { id: "impl-002", name: "Corona sobre Implante", category: "Implantes", basePrice: 8000, estimatedDuration: 60, complexity: "moderate", requiresFollowUp: true, followUpDays: 7, description: "Rehabilitación protésica sobre implante" },
  { id: "impl-003", name: "Injerto Óseo", category: "Implantes", basePrice: 12000, estimatedDuration: 120, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Aumento de hueso" },
  
  // Orthodontics
  { id: "orto-001", name: "Brackets Metálicos (tratamiento completo)", category: "Ortodoncia", basePrice: 35000, estimatedDuration: 60, complexity: "complex", requiresFollowUp: true, followUpDays: 30, description: "Ortodoncia convencional" },
  { id: "orto-002", name: "Brackets Estéticos", category: "Ortodoncia", basePrice: 45000, estimatedDuration: 60, complexity: "complex", requiresFollowUp: true, followUpDays: 30, description: "Brackets cerámicos o zafiro" },
  { id: "orto-003", name: "Alineadores Invisibles", category: "Ortodoncia", basePrice: 55000, estimatedDuration: 60, complexity: "complex", requiresFollowUp: true, followUpDays: 14, description: "Tratamiento con alineadores transparentes" },
  { id: "orto-004", name: "Retenedor", category: "Ortodoncia", basePrice: 3000, estimatedDuration: 30, complexity: "simple", requiresFollowUp: true, followUpDays: 90, description: "Retenedor fijo o removible" },
  
  // Aesthetics
  { id: "este-001", name: "Blanqueamiento en Consultorio", category: "Estética", basePrice: 5000, estimatedDuration: 90, complexity: "simple", requiresFollowUp: true, followUpDays: 14, description: "Blanqueamiento LED profesional" },
  { id: "este-002", name: "Blanqueamiento Casero", category: "Estética", basePrice: 3000, estimatedDuration: 30, complexity: "simple", requiresFollowUp: true, followUpDays: 14, description: "Kit de blanqueamiento para casa" },
  { id: "este-003", name: "Diseño de Sonrisa", category: "Estética", basePrice: 85000, estimatedDuration: 180, complexity: "complex", requiresFollowUp: true, followUpDays: 7, description: "Rehabilitación estética integral" },
  
  // Pediatric
  { id: "pedi-001", name: "Pulpotomía", category: "Pediatría", basePrice: 1500, estimatedDuration: 45, complexity: "moderate", requiresFollowUp: true, followUpDays: 30, description: "Tratamiento pulpar en diente temporal" },
  { id: "pedi-002", name: "Corona de Acero", category: "Pediatría", basePrice: 1200, estimatedDuration: 30, complexity: "simple", requiresFollowUp: false, description: "Corona prefabricada para diente temporal" },
  { id: "pedi-003", name: "Mantenedor de Espacio", category: "Pediatría", basePrice: 2500, estimatedDuration: 45, complexity: "moderate", requiresFollowUp: true, followUpDays: 90, description: "Aparato para mantener espacio dental" },
];

const PROCEDURE_CATEGORIES = [...new Set(PROCEDURES_CATALOG.map(p => p.category))];

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  high: { label: 'Alta', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  medium: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  low: { label: 'Baja', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-gray-500/10 text-gray-500' },
  scheduled: { label: 'Programado', color: 'bg-blue-500/10 text-blue-500' },
  in_progress: { label: 'En Proceso', color: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Completado', color: 'bg-green-500/10 text-green-500' },
};

interface TreatmentPlanGeneratorProps {
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorName?: string;
  onSave?: (plan: TreatmentPlan) => void;
}

export const TreatmentPlanGenerator = ({
  patientId = "",
  patientName = "",
  patientEmail = "",
  patientPhone = "",
  doctorName = "Dr. Carlos Mendoza",
  onSave
}: TreatmentPlanGeneratorProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchProcedure, setSearchProcedure] = useState("");
  const [showProcedureDialog, setShowProcedureDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedItemForSchedule, setSelectedItemForSchedule] = useState<TreatmentPlanItem | null>(null);

  // Plan state
  const [plan, setPlan] = useState<TreatmentPlan>({
    id: `TP-${Date.now()}`,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    doctorName,
    diagnosis: "",
    observations: "",
    items: [],
    subtotal: 0,
    discountTotal: 0,
    taxRate: 16,
    taxAmount: 0,
    total: 0,
    paymentTerms: "50% al iniciar, 50% al finalizar",
    validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // New item form
  const [newItem, setNewItem] = useState<Partial<TreatmentPlanItem>>({
    toothNumber: "",
    quadrant: "",
    quantity: 1,
    discount: 0,
    notes: "",
    priority: 'medium',
  });

  // Calculate totals
  const calculateTotals = (items: TreatmentPlanItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountTotal = items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.discount / 100)), 0);
    const taxableAmount = subtotal - discountTotal;
    const taxAmount = taxableAmount * (plan.taxRate / 100);
    const total = taxableAmount + taxAmount;
    return { subtotal, discountTotal, taxAmount, total };
  };

  // Filtered procedures
  const filteredProcedures = useMemo(() => {
    return PROCEDURES_CATALOG.filter(p => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchProcedure.toLowerCase()) ||
                           p.description.toLowerCase().includes(searchProcedure.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchProcedure]);

  // Add procedure to plan
  const addProcedureToPlan = (procedure: Procedure) => {
    const newPlanItem: TreatmentPlanItem = {
      id: `item-${Date.now()}`,
      procedureId: procedure.id,
      procedureName: procedure.name,
      toothNumber: newItem.toothNumber || "",
      quadrant: newItem.quadrant || "",
      quantity: newItem.quantity || 1,
      unitPrice: procedure.basePrice,
      discount: newItem.discount || 0,
      notes: newItem.notes || "",
      priority: newItem.priority || 'medium',
      status: 'pending',
      estimatedDuration: procedure.estimatedDuration,
    };

    const updatedItems = [...plan.items, newPlanItem];
    const totals = calculateTotals(updatedItems);
    
    setPlan({
      ...plan,
      items: updatedItems,
      ...totals,
      updatedAt: new Date().toISOString(),
    });

    setNewItem({ toothNumber: "", quadrant: "", quantity: 1, discount: 0, notes: "", priority: 'medium' });
    setShowProcedureDialog(false);
    toast({ title: "Procedimiento agregado", description: procedure.name });
  };

  // Remove item from plan
  const removeItemFromPlan = (itemId: string) => {
    const updatedItems = plan.items.filter(item => item.id !== itemId);
    const totals = calculateTotals(updatedItems);
    setPlan({ ...plan, items: updatedItems, ...totals, updatedAt: new Date().toISOString() });
  };

  // Update item
  const updatePlanItem = (itemId: string, updates: Partial<TreatmentPlanItem>) => {
    const updatedItems = plan.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    const totals = calculateTotals(updatedItems);
    setPlan({ ...plan, items: updatedItems, ...totals, updatedAt: new Date().toISOString() });
  };

  // Calculate total treatment time
  const totalDuration = useMemo(() => {
    return plan.items.reduce((sum, item) => sum + (item.estimatedDuration * item.quantity), 0);
  }, [plan.items]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (plan.items.length === 0) return 0;
    const completed = plan.items.filter(item => item.status === 'completed').length;
    return Math.round((completed / plan.items.length) * 100);
  }, [plan.items]);

  // Generate appointment schedule
  const generateSchedule = () => {
    const pendingItems = plan.items.filter(item => item.status === 'pending');
    let currentDate = new Date();
    
    const scheduledItems = pendingItems.map((item, index) => {
      // Add 1-2 weeks between appointments based on procedure complexity
      const procedure = PROCEDURES_CATALOG.find(p => p.id === item.procedureId);
      const daysToAdd = procedure?.complexity === 'complex' ? 14 : 7;
      currentDate = addDays(currentDate, index === 0 ? 1 : daysToAdd);
      
      return {
        ...item,
        scheduledDate: format(currentDate, 'yyyy-MM-dd'),
        status: 'scheduled' as const,
      };
    });

    const updatedItems = plan.items.map(item => {
      const scheduled = scheduledItems.find(s => s.id === item.id);
      return scheduled || item;
    });

    setPlan({ ...plan, items: updatedItems, updatedAt: new Date().toISOString() });
    toast({ title: "Agenda generada", description: `${scheduledItems.length} citas programadas automáticamente` });
  };

  // Print/Export quote
  const printQuote = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto Dental - ${plan.patientName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #1a5f7a; margin: 0; }
          .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #1a5f7a; color: white; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { font-weight: bold; font-size: 1.2em; color: #1a5f7a; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .terms { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NovellDent - Clínica Dental</h1>
          <p>Presupuesto de Tratamiento</p>
        </div>
        
        <div class="patient-info">
          <div>
            <p><strong>Paciente:</strong> ${plan.patientName}</p>
            <p><strong>Teléfono:</strong> ${plan.patientPhone}</p>
            <p><strong>Email:</strong> ${plan.patientEmail}</p>
          </div>
          <div>
            <p><strong>Folio:</strong> ${plan.id}</p>
            <p><strong>Fecha:</strong> ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
            <p><strong>Válido hasta:</strong> ${format(new Date(plan.validUntil), "d 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
        </div>
        
        <p><strong>Diagnóstico:</strong> ${plan.diagnosis}</p>
        
        <table>
          <thead>
            <tr>
              <th>Procedimiento</th>
              <th>Pieza</th>
              <th>Cant.</th>
              <th>Precio Unit.</th>
              <th>Desc.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${plan.items.map(item => `
              <tr>
                <td>${item.procedureName}</td>
                <td>${item.toothNumber || '-'}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toLocaleString()}</td>
                <td>${item.discount}%</td>
                <td>$${((item.unitPrice * item.quantity) * (1 - item.discount/100)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: $${plan.subtotal.toLocaleString()}</p>
          <p>Descuento: -$${plan.discountTotal.toLocaleString()}</p>
          <p>IVA (${plan.taxRate}%): $${plan.taxAmount.toLocaleString()}</p>
          <p class="total-row">TOTAL: $${plan.total.toLocaleString()} MXN</p>
        </div>
        
        <div class="terms">
          <p><strong>Condiciones de Pago:</strong> ${plan.paymentTerms}</p>
          <p><strong>Duración estimada del tratamiento:</strong> ${Math.ceil(totalDuration / 60)} horas aproximadamente</p>
        </div>
        
        <div style="margin-top: 40px;">
          <p><strong>Observaciones:</strong></p>
          <p>${plan.observations || 'Sin observaciones adicionales'}</p>
        </div>
        
        <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; padding-top: 10px;">
              <p>Firma del Paciente</p>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; padding-top: 10px;">
              <p>${plan.doctorName}</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>NovellDent - Puerto Vallarta, Jalisco | Tel: +52 322 183 7666 | www.novelldent.com</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Save plan
  const savePlan = () => {
    if (!plan.patientName) {
      toast({ title: "Error", description: "Ingrese el nombre del paciente", variant: "destructive" });
      return;
    }
    if (plan.items.length === 0) {
      toast({ title: "Error", description: "Agregue al menos un procedimiento", variant: "destructive" });
      return;
    }

    onSave?.(plan);
    toast({ title: "Plan guardado", description: `Plan ${plan.id} guardado correctamente` });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Procedimientos</p>
                <p className="text-2xl font-bold">{plan.items.length}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">${plan.total.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Est.</p>
                <p className="text-2xl font-bold">{Math.ceil(totalDuration / 60)}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avance</p>
                <p className="text-2xl font-bold">{completionPercentage}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-orange-500" />
            </div>
            <Progress value={completionPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Generador de Plan de Tratamiento
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={savePlan} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowPreviewDialog(true)} className="gap-2">
                <Eye className="w-4 h-4" />
                Vista Previa
              </Button>
              <Button onClick={printQuote} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir Presupuesto
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="create">Crear Plan</TabsTrigger>
              <TabsTrigger value="schedule">Agenda</TabsTrigger>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Paciente *</Label>
                  <Input
                    value={plan.patientName}
                    onChange={(e) => setPlan({ ...plan, patientName: e.target.value })}
                    placeholder="Nombre del paciente"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={plan.patientPhone}
                    onChange={(e) => setPlan({ ...plan, patientPhone: e.target.value })}
                    placeholder="+52 322 000 0000"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={plan.patientEmail}
                    onChange={(e) => setPlan({ ...plan, patientEmail: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Doctor</Label>
                  <Input
                    value={plan.doctorName}
                    onChange={(e) => setPlan({ ...plan, doctorName: e.target.value })}
                    placeholder="Dr. Nombre"
                  />
                </div>
              </div>

              <div>
                <Label>Diagnóstico</Label>
                <Textarea
                  value={plan.diagnosis}
                  onChange={(e) => setPlan({ ...plan, diagnosis: e.target.value })}
                  placeholder="Diagnóstico dental del paciente..."
                  rows={2}
                />
              </div>

              <Separator />

              {/* Procedures List */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Procedimientos del Plan</h3>
                <Button onClick={() => setShowProcedureDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Procedimiento
                </Button>
              </div>

              {plan.items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay procedimientos en el plan</p>
                  <Button variant="outline" onClick={() => setShowProcedureDialog(true)} className="mt-4">
                    Agregar Procedimiento
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Procedimiento</TableHead>
                        <TableHead>Pieza</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Desc.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.procedureName}</TableCell>
                          <TableCell>{item.toothNumber || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={PRIORITY_CONFIG[item.priority].color}>
                              {PRIORITY_CONFIG[item.priority].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updatePlanItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-16"
                              min={1}
                            />
                          </TableCell>
                          <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updatePlanItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                              className="w-16"
                              min={0}
                              max={100}
                            />%
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${((item.unitPrice * item.quantity) * (1 - item.discount/100)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.status}
                              onValueChange={(v) => updatePlanItem(item.id, { status: v as any })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => removeItemFromPlan(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              {/* Totals */}
              {plan.items.length > 0 && (
                <div className="flex justify-end">
                  <div className="w-80 space-y-2 p-4 bg-secondary/50 rounded-xl">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${plan.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-500">
                      <span>Descuento:</span>
                      <span>-${plan.discountTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA ({plan.taxRate}%):</span>
                      <span>${plan.taxAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>TOTAL:</span>
                      <span>${plan.total.toLocaleString()} MXN</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Programación de Citas</h3>
                <Button onClick={generateSchedule} className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Generar Agenda Automática
                </Button>
              </div>

              <div className="grid gap-4">
                {plan.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_CONFIG[item.status].color}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.procedureName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.toothNumber && `Pieza ${item.toothNumber} • `}
                          {item.estimatedDuration} min • ${item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={PRIORITY_CONFIG[item.priority].color}>
                        {PRIORITY_CONFIG[item.priority].label}
                      </Badge>
                      {item.scheduledDate ? (
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(item.scheduledDate), "d MMM yyyy", { locale: es })}</p>
                          <p className="text-sm text-muted-foreground">Programado</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItemForSchedule(item);
                            setShowScheduleDialog(true);
                          }}
                        >
                          Agendar
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información del Paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Nombre:</strong> {plan.patientName || '-'}</p>
                    <p><strong>Teléfono:</strong> {plan.patientPhone || '-'}</p>
                    <p><strong>Email:</strong> {plan.patientEmail || '-'}</p>
                    <p><strong>Doctor:</strong> {plan.doctorName || '-'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resumen Financiero</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Subtotal:</strong> ${plan.subtotal.toLocaleString()}</p>
                    <p><strong>Descuentos:</strong> ${plan.discountTotal.toLocaleString()}</p>
                    <p><strong>IVA:</strong> ${plan.taxAmount.toLocaleString()}</p>
                    <p className="text-xl font-bold"><strong>Total:</strong> ${plan.total.toLocaleString()} MXN</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalles del Tratamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Procedimientos</p>
                      <p className="text-2xl font-bold">{plan.items.length}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tiempo Total</p>
                      <p className="text-2xl font-bold">{Math.ceil(totalDuration / 60)}h</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Citas Programadas</p>
                      <p className="text-2xl font-bold">{plan.items.filter(i => i.scheduledDate).length}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Completados</p>
                      <p className="text-2xl font-bold">{plan.items.filter(i => i.status === 'completed').length}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">Diagnóstico:</p>
                    <p className="text-muted-foreground">{plan.diagnosis || 'No especificado'}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Condiciones de Pago</Label>
                  <Textarea
                    value={plan.paymentTerms}
                    onChange={(e) => setPlan({ ...plan, paymentTerms: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={plan.observations}
                    onChange={(e) => setPlan({ ...plan, observations: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Procedure Dialog */}
      <Dialog open={showProcedureDialog} onOpenChange={setShowProcedureDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Agregar Procedimiento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar procedimiento..."
                  value={searchProcedure}
                  onChange={(e) => setSearchProcedure(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PROCEDURE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Pieza Dental</Label>
                <Input
                  value={newItem.toothNumber || ""}
                  onChange={(e) => setNewItem({ ...newItem, toothNumber: e.target.value })}
                  placeholder="Ej: 36"
                />
              </div>
              <div>
                <Label>Cuadrante</Label>
                <Select value={newItem.quadrant || ""} onValueChange={(v) => setNewItem({ ...newItem, quadrant: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I - Superior Derecho</SelectItem>
                    <SelectItem value="II">II - Superior Izquierdo</SelectItem>
                    <SelectItem value="III">III - Inferior Izquierdo</SelectItem>
                    <SelectItem value="IV">IV - Inferior Derecho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={newItem.quantity || 1}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={newItem.priority || "medium"} onValueChange={(v: any) => setNewItem({ ...newItem, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-xl p-4">
              <div className="grid gap-3">
                {filteredProcedures.map((procedure) => (
                  <motion.div
                    key={procedure.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/50 cursor-pointer transition-all"
                    onClick={() => addProcedureToPlan(procedure)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{procedure.name}</p>
                        <Badge variant="outline">{procedure.category}</Badge>
                        <Badge variant="outline" className={
                          procedure.complexity === 'complex' ? 'bg-red-500/10 text-red-500' :
                          procedure.complexity === 'moderate' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-green-500/10 text-green-500'
                        }>
                          {procedure.complexity === 'complex' ? 'Complejo' : 
                           procedure.complexity === 'moderate' ? 'Moderado' : 'Simple'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{procedure.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⏱ {procedure.estimatedDuration} min
                        {procedure.requiresFollowUp && ` • Seguimiento: ${procedure.followUpDays} días`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${procedure.basePrice.toLocaleString()}</p>
                      <Button size="sm" className="mt-2">
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Cita</DialogTitle>
          </DialogHeader>
          {selectedItemForSchedule && (
            <div className="space-y-4">
              <p className="font-medium">{selectedItemForSchedule.procedureName}</p>
              <div>
                <Label>Fecha de la Cita</Label>
                <Input
                  type="date"
                  value={selectedItemForSchedule.scheduledDate || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => {
                    updatePlanItem(selectedItemForSchedule.id, { 
                      scheduledDate: e.target.value,
                      status: 'scheduled'
                    });
                    setShowScheduleDialog(false);
                    toast({ title: "Cita programada" });
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Presupuesto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 p-6 bg-white text-black rounded-lg">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-primary">NovellDent - Clínica Dental</h1>
              <p className="text-muted-foreground">Presupuesto de Tratamiento</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Paciente:</strong> {plan.patientName}</p>
                <p><strong>Teléfono:</strong> {plan.patientPhone}</p>
                <p><strong>Email:</strong> {plan.patientEmail}</p>
              </div>
              <div className="text-right">
                <p><strong>Folio:</strong> {plan.id}</p>
                <p><strong>Fecha:</strong> {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
                <p><strong>Válido hasta:</strong> {format(new Date(plan.validUntil), "d 'de' MMMM, yyyy", { locale: es })}</p>
              </div>
            </div>

            <div>
              <p><strong>Diagnóstico:</strong> {plan.diagnosis}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Pieza</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Desc.</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.procedureName}</TableCell>
                    <TableCell>{item.toothNumber || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>{item.discount}%</TableCell>
                    <TableCell>${((item.unitPrice * item.quantity) * (1 - item.discount/100)).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="text-right space-y-1">
              <p>Subtotal: ${plan.subtotal.toLocaleString()}</p>
              <p>Descuento: -${plan.discountTotal.toLocaleString()}</p>
              <p>IVA ({plan.taxRate}%): ${plan.taxAmount.toLocaleString()}</p>
              <p className="text-2xl font-bold text-primary">TOTAL: ${plan.total.toLocaleString()} MXN</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <p><strong>Condiciones de Pago:</strong> {plan.paymentTerms}</p>
              <p><strong>Tiempo estimado:</strong> {Math.ceil(totalDuration / 60)} horas</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Cerrar</Button>
            <Button onClick={printQuote}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
