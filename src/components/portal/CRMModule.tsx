import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users, UserPlus, Phone, Mail, MessageSquare, Target, TrendingUp,
  Search, Filter, Plus, MoreHorizontal, ChevronDown, Calendar,
  DollarSign, Tag, Star, Clock, CheckCircle2, XCircle, ArrowRight,
  Megaphone, Send, BarChart3, Heart, Gift, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'nuevo' | 'contactado' | 'interesado' | 'cotizado' | 'ganado' | 'perdido';
  value: number;
  assignedTo?: string;
  notes: string;
  tags: string[];
  createdAt: Date;
  lastContact?: Date;
  nextFollowUp?: Date;
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

// Mock Data
const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'María García', email: 'maria@email.com', phone: '+52 555 123 4567', source: 'Facebook', status: 'nuevo', value: 15000, notes: 'Interesada en blanqueamiento', tags: ['Estética', 'Premium'], createdAt: new Date(), nextFollowUp: new Date(Date.now() + 86400000) },
  { id: '2', name: 'Carlos López', email: 'carlos@email.com', phone: '+52 555 234 5678', source: 'Google', status: 'contactado', value: 25000, notes: 'Necesita ortodoncia', tags: ['Ortodoncia'], createdAt: new Date(Date.now() - 86400000 * 2) },
  { id: '3', name: 'Ana Martínez', email: 'ana@email.com', phone: '+52 555 345 6789', source: 'Referido', status: 'interesado', value: 8000, notes: 'Limpieza dental', tags: ['General'], createdAt: new Date(Date.now() - 86400000 * 5) },
  { id: '4', name: 'Roberto Sánchez', email: 'roberto@email.com', phone: '+52 555 456 7890', source: 'Instagram', status: 'cotizado', value: 45000, notes: 'Implantes dentales x2', tags: ['Implantes', 'Premium'], createdAt: new Date(Date.now() - 86400000 * 7), lastContact: new Date(Date.now() - 86400000) },
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
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ status: 'nuevo', tags: [] });

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    nuevos: leads.filter(l => l.status === 'nuevo').length,
    enProceso: leads.filter(l => ['contactado', 'interesado', 'cotizado'].includes(l.status)).length,
    ganados: leads.filter(l => l.status === 'ganado').length,
    valorPotencial: leads.reduce((sum, l) => sum + l.value, 0),
  }), [leads]);

  // Handle add lead
  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: newLead.name!,
      email: newLead.email!,
      phone: newLead.phone || '',
      source: newLead.source || 'Web',
      status: 'nuevo',
      value: newLead.value || 0,
      notes: newLead.notes || '',
      tags: newLead.tags || [],
      createdAt: new Date(),
    };
    setLeads([lead, ...leads]);
    setShowAddLead(false);
    setNewLead({ status: 'nuevo', tags: [] });
    toast({ title: "Lead agregado", description: "El lead se ha creado correctamente" });
  };

  // Update lead status
  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, status, lastContact: new Date() } : l));
    toast({ title: "Estado actualizado" });
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.nuevos}</p>
                <p className="text-xs text-muted-foreground">Nuevos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.enProceso}</p>
                <p className="text-xs text-muted-foreground">En proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ganados}</p>
                <p className="text-xs text-muted-foreground">Ganados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(stats.valorPotencial / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Valor potencial</p>
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {LEAD_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
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
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="divide-y">
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
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
                          <Badge className={`${LEAD_STATUSES.find(s => s.value === lead.status)?.color} text-white`}>
                            {LEAD_STATUSES.find(s => s.value === lead.status)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg">${lead.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{lead.source}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        {lead.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {LEAD_STATUSES.map(status => (
                            <DropdownMenuItem 
                              key={status.value}
                              onClick={() => updateLeadStatus(lead.id, status.value as Lead['status'])}
                            >
                              <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
                              Marcar como {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {lead.notes && (
                      <p className="text-sm text-muted-foreground mt-2 ml-16">{lead.notes}</p>
                    )}
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
                          <p className="font-medium text-sm truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">${lead.value.toLocaleString()}</p>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

                    <Badge variant={
                      campaign.status === 'activa' ? 'default' :
                      campaign.status === 'completada' ? 'secondary' :
                      campaign.status === 'programada' ? 'outline' : 'destructive'
                    }>
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{campaign.sent}</p>
                      <p className="text-xs text-muted-foreground">Enviados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{campaign.opened}</p>
                      <p className="text-xs text-muted-foreground">Abiertos</p>
                      {campaign.sent > 0 && (
                        <Progress value={(campaign.opened / campaign.sent) * 100} className="h-1 mt-1" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{campaign.clicked}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{campaign.converted}</p>
                      <p className="text-xs text-muted-foreground">Convertidos</p>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Nuevo Lead
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newLead.name || ''}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newLead.email || ''}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={newLead.phone || ''}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+52 555 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fuente</Label>
                <Select value={newLead.source || ''} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor estimado</Label>
                <Input
                  type="number"
                  value={newLead.value || ''}
                  onChange={(e) => setNewLead({ ...newLead, value: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={newLead.notes || ''}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Información adicional..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLead(false)}>Cancelar</Button>
            <Button onClick={handleAddLead}>Crear Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMModule;
