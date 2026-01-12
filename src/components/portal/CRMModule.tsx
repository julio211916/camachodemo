import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { format, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users, UserPlus, Phone, Mail, MessageSquare, Target, TrendingUp,
  Search, Filter, Plus, MoreHorizontal, ChevronDown, Calendar,
  DollarSign, Tag, Star, Clock, CheckCircle2, XCircle, ArrowRight,
  Megaphone, Send, BarChart3, Heart, Gift, Zap, Bot, Timer, Bell,
  Flame, Thermometer, Snowflake, AlertCircle, RefreshCw, Settings,
  Play, Pause, Trash2, Edit2, Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useTags } from "@/hooks/use-tags";

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'nuevo' | 'contactado' | 'interesado' | 'cotizado' | 'ganado' | 'perdido';
  value: number;
  score: number; // Lead scoring 0-100
  temperature: 'cold' | 'warm' | 'hot';
  assignedTo?: string;
  notes: string;
  tags: string[];
  createdAt: Date;
  lastContact?: Date;
  nextFollowUp?: Date;
  autoFollowUpEnabled: boolean;
  interactions: number;
  emailsOpened: number;
  emailsSent: number;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: 'no_contact' | 'email_opened' | 'status_change' | 'score_threshold' | 'birthday' | 'inactivity' | 'nurturing_sequence' | 'treatment_followup';
  triggerValue?: number;
  triggerDays?: number;
  action: 'send_email' | 'send_whatsapp' | 'create_task' | 'assign_to' | 'change_status' | 'send_sms' | 'add_tag';
  actionValue?: string;
  sequence?: NurturingStep[];
  isActive: boolean;
  executedCount: number;
  category: 'engagement' | 'birthday' | 'inactivity' | 'nurturing' | 'followup';
}

interface NurturingStep {
  id: string;
  day: number;
  action: 'send_email' | 'send_whatsapp' | 'send_sms';
  template: string;
  subject?: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms' | 'llamada';
  status: 'borrador' | 'programada' | 'activa' | 'pausada' | 'completada';
  target: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  startDate: Date;
  endDate?: Date;
}

// Calculate lead score
const calculateLeadScore = (lead: Partial<Lead>): number => {
  let score = 0;
  
  // Source scoring
  const sourceScores: Record<string, number> = {
    'Referido': 25,
    'Google': 20,
    'Facebook': 15,
    'Instagram': 15,
    'Web': 10,
    'WhatsApp': 10,
    'Llamada': 20,
  };
  score += sourceScores[lead.source || ''] || 5;
  
  // Value scoring
  if ((lead.value || 0) > 30000) score += 25;
  else if ((lead.value || 0) > 15000) score += 15;
  else if ((lead.value || 0) > 5000) score += 10;
  
  // Interactions scoring
  score += Math.min((lead.interactions || 0) * 5, 20);
  
  // Email engagement
  if (lead.emailsSent && lead.emailsSent > 0) {
    const openRate = (lead.emailsOpened || 0) / lead.emailsSent;
    if (openRate > 0.5) score += 15;
    else if (openRate > 0.25) score += 10;
  }
  
  // Recent contact bonus
  if (lead.lastContact) {
    const daysSinceContact = differenceInDays(new Date(), lead.lastContact);
    if (daysSinceContact < 3) score += 15;
    else if (daysSinceContact < 7) score += 10;
  }
  
  return Math.min(score, 100);
};

// Determine temperature
const getTemperature = (score: number): 'cold' | 'warm' | 'hot' => {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
};

// Mock Data with scoring
const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'María García', email: 'maria@email.com', phone: '+52 555 123 4567', source: 'Facebook', status: 'nuevo', value: 15000, score: 45, temperature: 'warm', notes: 'Interesada en blanqueamiento', tags: ['Estética', 'Premium'], createdAt: new Date(), nextFollowUp: new Date(Date.now() + 86400000), autoFollowUpEnabled: true, interactions: 2, emailsOpened: 1, emailsSent: 2 },
  { id: '2', name: 'Carlos López', email: 'carlos@email.com', phone: '+52 555 234 5678', source: 'Google', status: 'contactado', value: 25000, score: 65, temperature: 'warm', notes: 'Necesita ortodoncia', tags: ['Ortodoncia'], createdAt: new Date(Date.now() - 86400000 * 2), autoFollowUpEnabled: true, interactions: 5, emailsOpened: 3, emailsSent: 4, lastContact: new Date(Date.now() - 86400000) },
  { id: '3', name: 'Ana Martínez', email: 'ana@email.com', phone: '+52 555 345 6789', source: 'Referido', status: 'interesado', value: 8000, score: 75, temperature: 'hot', notes: 'Limpieza dental', tags: ['General'], createdAt: new Date(Date.now() - 86400000 * 5), autoFollowUpEnabled: false, interactions: 8, emailsOpened: 5, emailsSent: 5, lastContact: new Date() },
  { id: '4', name: 'Roberto Sánchez', email: 'roberto@email.com', phone: '+52 555 456 7890', source: 'Instagram', status: 'cotizado', value: 45000, score: 85, temperature: 'hot', notes: 'Implantes dentales x2', tags: ['Implantes', 'Premium'], createdAt: new Date(Date.now() - 86400000 * 7), lastContact: new Date(Date.now() - 86400000), autoFollowUpEnabled: true, interactions: 12, emailsOpened: 8, emailsSent: 10 },
];

const MOCK_AUTOMATIONS: AutomationRule[] = [
  // Engagement automations
  { id: '1', name: 'Seguimiento 3 días sin contacto', description: 'Envía recordatorio automático cuando no hay contacto en 3 días', trigger: 'no_contact', triggerValue: 3, action: 'send_email', actionValue: 'template_followup', isActive: true, executedCount: 45, category: 'engagement' },
  { id: '2', name: 'Email abierto - crear tarea', description: 'Crea tarea de llamada cuando el lead abre un email', trigger: 'email_opened', action: 'create_task', actionValue: 'Llamar al lead', isActive: true, executedCount: 23, category: 'engagement' },
  { id: '3', name: 'Score alto - asignar manager', description: 'Asigna leads con score > 80 al gerente de ventas', trigger: 'score_threshold', triggerValue: 80, action: 'assign_to', actionValue: 'manager_sales', isActive: false, executedCount: 12, category: 'engagement' },
  { id: '4', name: 'Lead interesado - enviar catálogo', description: 'Envía catálogo de servicios cuando el lead muestra interés', trigger: 'status_change', triggerValue: 2, action: 'send_whatsapp', actionValue: 'catalogo_servicios', isActive: true, executedCount: 67, category: 'engagement' },
  
  // Birthday automations
  { id: '5', name: 'Felicitación de cumpleaños', description: 'Envía felicitación y promoción especial el día del cumpleaños', trigger: 'birthday', triggerDays: 0, action: 'send_email', actionValue: 'birthday_greeting', isActive: true, executedCount: 156, category: 'birthday' },
  { id: '6', name: 'Recordatorio pre-cumpleaños', description: 'Envía WhatsApp 3 días antes del cumpleaños', trigger: 'birthday', triggerDays: -3, action: 'send_whatsapp', actionValue: 'birthday_promo', isActive: true, executedCount: 89, category: 'birthday' },
  { id: '7', name: 'Oferta post-cumpleaños', description: 'Envía oferta especial válida por 7 días después del cumpleaños', trigger: 'birthday', triggerDays: 1, action: 'send_email', actionValue: 'birthday_offer', isActive: false, executedCount: 34, category: 'birthday' },
  
  // Inactivity automations
  { id: '8', name: 'Alerta inactividad 30 días', description: 'Envía recordatorio cuando paciente no agenda en 30 días', trigger: 'inactivity', triggerDays: 30, action: 'send_email', actionValue: 'reactivation_30', isActive: true, executedCount: 234, category: 'inactivity' },
  { id: '9', name: 'Alerta inactividad 60 días', description: 'Envía oferta especial a pacientes inactivos por 60 días', trigger: 'inactivity', triggerDays: 60, action: 'send_whatsapp', actionValue: 'reactivation_60', isActive: true, executedCount: 145, category: 'inactivity' },
  { id: '10', name: 'Alerta inactividad 90 días', description: 'Llamada de seguimiento para pacientes inactivos 90 días', trigger: 'inactivity', triggerDays: 90, action: 'create_task', actionValue: 'Llamar paciente inactivo', isActive: true, executedCount: 78, category: 'inactivity' },
  { id: '11', name: 'Paciente perdido 180 días', description: 'Campaña de recuperación para pacientes sin visita en 6 meses', trigger: 'inactivity', triggerDays: 180, action: 'send_email', actionValue: 'win_back_campaign', isActive: false, executedCount: 23, category: 'inactivity' },
  
  // Nurturing sequences
  { id: '12', name: 'Secuencia Bienvenida Nuevos', description: 'Serie de 5 emails educativos para nuevos leads', trigger: 'nurturing_sequence', action: 'send_email', isActive: true, executedCount: 412, category: 'nurturing', sequence: [
    { id: 's1', day: 0, action: 'send_email', template: 'welcome', subject: 'Bienvenido a nuestra clínica' },
    { id: 's2', day: 2, action: 'send_email', template: 'services', subject: 'Conoce nuestros servicios' },
    { id: 's3', day: 5, action: 'send_whatsapp', template: 'promo_first', subject: '' },
    { id: 's4', day: 7, action: 'send_email', template: 'testimonials', subject: 'Lo que dicen nuestros pacientes' },
    { id: 's5', day: 14, action: 'send_email', template: 'appointment_cta', subject: 'Agenda tu primera cita' },
  ]},
  { id: '13', name: 'Secuencia Ortodoncia', description: 'Información sobre tratamientos de ortodoncia', trigger: 'nurturing_sequence', action: 'send_email', isActive: true, executedCount: 89, category: 'nurturing', sequence: [
    { id: 's1', day: 0, action: 'send_email', template: 'ortho_intro', subject: 'Transforma tu sonrisa' },
    { id: 's2', day: 3, action: 'send_email', template: 'ortho_types', subject: 'Tipos de ortodoncia disponibles' },
    { id: 's3', day: 7, action: 'send_whatsapp', template: 'ortho_promo', subject: '' },
  ]},
  { id: '14', name: 'Secuencia Implantes', description: 'Educación sobre implantes dentales', trigger: 'nurturing_sequence', action: 'send_email', isActive: false, executedCount: 45, category: 'nurturing', sequence: [
    { id: 's1', day: 0, action: 'send_email', template: 'implant_intro', subject: 'Recupera tu sonrisa con implantes' },
    { id: 's2', day: 5, action: 'send_email', template: 'implant_process', subject: 'El proceso paso a paso' },
  ]},
  
  // Treatment followup
  { id: '15', name: 'Post-tratamiento 24h', description: 'Seguimiento 24 horas después del tratamiento', trigger: 'treatment_followup', triggerDays: 1, action: 'send_whatsapp', actionValue: 'post_treatment_24h', isActive: true, executedCount: 567, category: 'followup' },
  { id: '16', name: 'Recordatorio revisión 6 meses', description: 'Recordatorio para revisión semestral', trigger: 'treatment_followup', triggerDays: 180, action: 'send_email', actionValue: 'checkup_reminder', isActive: true, executedCount: 234, category: 'followup' },
  { id: '17', name: 'Satisfacción post-servicio', description: 'Encuesta de satisfacción 3 días después', trigger: 'treatment_followup', triggerDays: 3, action: 'send_email', actionValue: 'satisfaction_survey', isActive: true, executedCount: 456, category: 'followup' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Promo Blanqueamiento Enero', type: 'email', status: 'activa', target: 'Todos los leads', sent: 250, opened: 180, clicked: 45, converted: 12, startDate: new Date() },
  { id: '2', name: 'Recordatorio Citas', type: 'whatsapp', status: 'activa', target: 'Pacientes activos', sent: 120, opened: 115, clicked: 0, converted: 0, startDate: new Date(Date.now() - 86400000 * 3) },
  { id: '3', name: 'Campaña Ortodoncia', type: 'sms', status: 'programada', target: 'Leads interesados', sent: 0, opened: 0, clicked: 0, converted: 0, startDate: new Date(Date.now() + 86400000 * 7) },
];

const LEAD_STATUSES = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { value: 'contactado', label: 'Contactado', color: 'bg-yellow-500' },
  { value: 'interesado', label: 'Interesado', color: 'bg-purple-500' },
  { value: 'cotizado', label: 'Cotizado', color: 'bg-orange-500' },
  { value: 'ganado', label: 'Ganado', color: 'bg-green-500' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-500' },
];

const LEAD_SOURCES = ['Facebook', 'Google', 'Instagram', 'Referido', 'Web', 'WhatsApp', 'Llamada'];

export const CRMModule = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [automations, setAutomations] = useState<AutomationRule[]>(MOCK_AUTOMATIONS);
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddAutomation, setShowAddAutomation] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ status: 'nuevo', tags: [], autoFollowUpEnabled: true });
  const [newAutomation, setNewAutomation] = useState<Partial<AutomationRule>>({ isActive: true });

  // Auto-refresh scores
  useEffect(() => {
    const interval = setInterval(() => {
      setLeads(prev => prev.map(lead => {
        const newScore = calculateLeadScore(lead);
        return { ...lead, score: newScore, temperature: getTemperature(newScore) };
      }));
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesTemp = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      return matchesSearch && matchesStatus && matchesTemp;
    });
  }, [leads, searchQuery, statusFilter, temperatureFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    nuevos: leads.filter(l => l.status === 'nuevo').length,
    enProceso: leads.filter(l => ['contactado', 'interesado', 'cotizado'].includes(l.status)).length,
    ganados: leads.filter(l => l.status === 'ganado').length,
    valorPotencial: leads.reduce((sum, l) => sum + l.value, 0),
    hotLeads: leads.filter(l => l.temperature === 'hot').length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length),
    automationsActive: automations.filter(a => a.isActive).length,
  }), [leads, automations]);

  // Handle add lead
  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }
    const score = calculateLeadScore(newLead);
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: newLead.name!,
      email: newLead.email!,
      phone: newLead.phone || '',
      source: newLead.source || 'Web',
      status: 'nuevo',
      value: newLead.value || 0,
      score,
      temperature: getTemperature(score),
      notes: newLead.notes || '',
      tags: newLead.tags || [],
      createdAt: new Date(),
      autoFollowUpEnabled: newLead.autoFollowUpEnabled || false,
      interactions: 0,
      emailsOpened: 0,
      emailsSent: 0,
    };
    setLeads([lead, ...leads]);
    setShowAddLead(false);
    setNewLead({ status: 'nuevo', tags: [], autoFollowUpEnabled: true });
    toast({ title: "Lead agregado", description: `Score inicial: ${score}` });
  };

  // Toggle automation
  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
    toast({ title: "Automatización actualizada" });
  };

  // Update lead status
  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads(leads.map(l => {
      if (l.id === leadId) {
        const updated = { ...l, status, lastContact: new Date(), interactions: l.interactions + 1 };
        updated.score = calculateLeadScore(updated);
        updated.temperature = getTemperature(updated.score);
        return updated;
      }
      return l;
    }));
    toast({ title: "Estado actualizado" });
  };

  // Get temperature icon
  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
      default: return <Snowflake className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xl font-bold">{stats.hotLeads}</p>
                <p className="text-xs text-muted-foreground">Leads Hot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xl font-bold">{stats.avgScore}</p>
                <p className="text-xs text-muted-foreground">Score Prom.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xl font-bold">{stats.ganados}</p>
                <p className="text-xs text-muted-foreground">Ganados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xl font-bold">${(stats.valorPotencial / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xl font-bold">{stats.nuevos}</p>
                <p className="text-xs text-muted-foreground">Nuevos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xl font-bold">{stats.enProceso}</p>
                <p className="text-xs text-muted-foreground">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xl font-bold">{stats.automationsActive}</p>
                <p className="text-xs text-muted-foreground">Auto. Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Bot className="w-4 h-4" />
              Automatizaciones
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Campañas
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar leads..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {LEAD_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">🌡️ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddLead(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        <TabsContent value="leads" className="flex-1 mt-4">
          <Card className="h-full">
            <ScrollArea className="h-[calc(100vh-420px)]">
              <div className="divide-y">
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setShowLeadDetails(lead)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{lead.name}</h4>
                          {getTemperatureIcon(lead.temperature)}
                          <Badge className={`${LEAD_STATUSES.find(s => s.value === lead.status)?.color} text-white`}>
                            {LEAD_STATUSES.find(s => s.value === lead.status)?.label}
                          </Badge>
                          {lead.autoFollowUpEnabled && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Bot className="w-3 h-3" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                        </div>
                      </div>

                      {/* Score indicator */}
                      <div className="text-center w-20">
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="w-14 h-14 -rotate-90">
                            <circle cx="28" cy="28" r="24" className="stroke-muted fill-none" strokeWidth="4" />
                            <circle 
                              cx="28" cy="28" r="24" 
                              className={`fill-none ${lead.score >= 70 ? 'stroke-red-500' : lead.score >= 40 ? 'stroke-orange-500' : 'stroke-blue-500'}`}
                              strokeWidth="4"
                              strokeDasharray={`${lead.score * 1.5} 150`}
                            />
                          </svg>
                          <span className="absolute text-sm font-bold">{lead.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg">${lead.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{lead.source}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        {lead.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Llamando...", description: lead.phone }); }}>
                            <Phone className="w-4 h-4 mr-2" />
                            Llamar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Abriendo WhatsApp..." }); }}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Abriendo email..." }); }}>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {LEAD_STATUSES.map(status => (
                            <DropdownMenuItem 
                              key={status.value}
                              onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, status.value as Lead['status']); }}
                            >
                              <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
                              Marcar como {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Progress bar for score */}
                    <div className="mt-2 ml-16 flex items-center gap-2">
                      <Progress value={lead.score} className="h-1.5 flex-1" />
                      {lead.nextFollowUp && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          Seguimiento: {format(lead.nextFollowUp, "d MMM", { locale: es })}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 mt-4">
          <div className="grid grid-cols-6 gap-4 h-full">
            {LEAD_STATUSES.map((status) => {
              const statusLeads = leads.filter(l => l.status === status.value);
              const totalValue = statusLeads.reduce((sum, l) => sum + l.value, 0);
              
              return (
                <Card key={status.value} className="flex flex-col">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        <CardTitle className="text-sm">{status.label}</CardTitle>
                      </div>
                      <Badge variant="secondary">{statusLeads.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">${totalValue.toLocaleString()}</p>
                  </CardHeader>
                  <CardContent className="flex-1 p-2 overflow-auto">
                    <div className="space-y-2">
                      {statusLeads.map(lead => (
                        <Card key={lead.id} className="p-2 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                            {getTemperatureIcon(lead.temperature)}
                          </div>
                          <p className="text-xs text-muted-foreground">${lead.value.toLocaleString()}</p>
                          <Progress value={lead.score} className="h-1 mt-1" />
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="flex-1 mt-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Automatizaciones de Seguimiento</h3>
                <p className="text-sm text-muted-foreground">Configure reglas automáticas para el seguimiento de leads</p>
              </div>
              <Button onClick={() => setShowAddAutomation(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Automatización
              </Button>
            </div>

            <div className="grid gap-3">
              {automations.map((automation) => (
                <Card key={automation.id} className={`${automation.isActive ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/10' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${automation.isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
                          <Bot className={`w-5 h-5 ${automation.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{automation.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Ejecutada {automation.executedCount} veces
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                          {automation.isActive ? 'Activa' : 'Pausada'}
                        </Badge>
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() => toggleAutomation(automation.id)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="flex-1 mt-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        campaign.type === 'email' ? 'bg-blue-500/10' :
                        campaign.type === 'whatsapp' ? 'bg-green-500/10' :
                        campaign.type === 'sms' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                      }`}>
                        {campaign.type === 'email' ? <Mail className="w-5 h-5 text-blue-500" /> :
                         campaign.type === 'whatsapp' ? <MessageSquare className="w-5 h-5 text-green-500" /> :
                         campaign.type === 'sms' ? <Send className="w-5 h-5 text-purple-500" /> :
                         <Phone className="w-5 h-5 text-orange-500" />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.target}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold">{campaign.sent}</p>
                        <p className="text-xs text-muted-foreground">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{campaign.opened}</p>
                        <p className="text-xs text-muted-foreground">Abiertos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">{campaign.clicked}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{campaign.converted}</p>
                        <p className="text-xs text-muted-foreground">Convertidos</p>
                      </div>
                      <Badge variant={
                        campaign.status === 'activa' ? 'default' :
                        campaign.status === 'completada' ? 'secondary' :
                        campaign.status === 'programada' ? 'outline' : 'destructive'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Lead</DialogTitle>
            <DialogDescription>Agrega un nuevo lead al sistema CRM</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={newLead.name || ''}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newLead.email || ''}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={newLead.phone || ''}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+52 555 123 4567"
                />
              </div>
              <div>
                <Label>Origen</Label>
                <Select 
                  value={newLead.source || ''} 
                  onValueChange={(v) => setNewLead({ ...newLead, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor estimado ($)</Label>
              <Input
                type="number"
                value={newLead.value || ''}
                onChange={(e) => setNewLead({ ...newLead, value: parseFloat(e.target.value) || 0 })}
                placeholder="15000"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={newLead.notes || ''}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Notas sobre el lead..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newLead.autoFollowUpEnabled || false}
                onCheckedChange={(v) => setNewLead({ ...newLead, autoFollowUpEnabled: v })}
              />
              <Label>Habilitar seguimiento automático</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLead(false)}>Cancelar</Button>
            <Button onClick={handleAddLead}>Agregar Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog open={!!showLeadDetails} onOpenChange={() => setShowLeadDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showLeadDetails?.name}
              {showLeadDetails && getTemperatureIcon(showLeadDetails.temperature)}
            </DialogTitle>
          </DialogHeader>
          {showLeadDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="35" className="stroke-muted fill-none" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="35" 
                          className={`fill-none ${showLeadDetails.score >= 70 ? 'stroke-red-500' : showLeadDetails.score >= 40 ? 'stroke-orange-500' : 'stroke-blue-500'}`}
                          strokeWidth="6"
                          strokeDasharray={`${showLeadDetails.score * 2.2} 220`}
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">{showLeadDetails.score}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Lead Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">${showLeadDetails.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Valor Potencial</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{showLeadDetails.interactions}</p>
                    <p className="text-sm text-muted-foreground">Interacciones</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{showLeadDetails.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{showLeadDetails.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Origen</Label>
                  <p className="font-medium">{showLeadDetails.source}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Creado</Label>
                  <p className="font-medium">{format(showLeadDetails.createdAt, "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Notas</Label>
                <p className="mt-1">{showLeadDetails.notes || 'Sin notas'}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <Phone className="w-4 h-4" />
                  Llamar
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
