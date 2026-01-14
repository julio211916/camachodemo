import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, Edit2, Trash2, Filter, Download, Upload,
  DollarSign, Clock, FlaskConical, Tag, MoreHorizontal,
  Check, X, Save, Percent, Calculator, FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  convention_price: number | null;
  cost: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  requires_lab: boolean;
  image_url: string | null;
  display_order: number | null;
  iva_rate?: number;
  lab_cost?: number;
  commission_rate?: number;
  created_at: string;
}

interface ServiceForm {
  code: string;
  name: string;
  description: string;
  category: string;
  base_price: string;
  convention_price: string;
  cost: string;
  duration_minutes: string;
  is_active: boolean;
  requires_lab: boolean;
  iva_rate: string;
  lab_cost: string;
  commission_rate: string;
}

const CATEGORIES = [
  'Diagnóstico', 'Profilaxis', 'Restauración', 'Endodoncia', 
  'Cirugía', 'Prótesis', 'Implantología', 'Ortodoncia', 'Estética', 'Otros'
];

const initialFormState: ServiceForm = {
  code: '',
  name: '',
  description: '',
  category: 'Diagnóstico',
  base_price: '',
  convention_price: '',
  cost: '',
  duration_minutes: '30',
  is_active: true,
  requires_lab: false,
  iva_rate: '16',
  lab_cost: '0',
  commission_rate: '30'
};

export const ServicesCatalogManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("catalog");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceForm>(initialFormState);

  // Fetch services from database
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    }
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('services_catalog')
        .insert(service)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast({ title: "Servicio creado", description: "El servicio ha sido agregado al catálogo" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { error } = await supabase
        .from('services_catalog')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast({ title: "Servicio actualizado" });
      setEditingService(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services_catalog')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast({ title: "Servicio eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || '',
      category: service.category,
      base_price: service.base_price.toString(),
      convention_price: service.convention_price?.toString() || '',
      cost: service.cost?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '30',
      is_active: service.is_active,
      requires_lab: service.requires_lab,
      iva_rate: (service.iva_rate || 16).toString(),
      lab_cost: (service.lab_cost || 0).toString(),
      commission_rate: (service.commission_rate || 30).toString()
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name || !formData.base_price) {
      toast({ title: "Error", description: "Código, nombre y precio base son requeridos", variant: "destructive" });
      return;
    }

    const serviceData = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      base_price: parseFloat(formData.base_price),
      convention_price: formData.convention_price ? parseFloat(formData.convention_price) : null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      duration_minutes: parseInt(formData.duration_minutes) || 30,
      is_active: formData.is_active,
      requires_lab: formData.requires_lab,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, ...serviceData });
    } else {
      createMutation.mutate(serviceData as any);
    }
  };

  const handleToggleActive = (service: Service) => {
    updateMutation.mutate({ id: service.id, is_active: !service.is_active });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Código', 'Nombre', 'Categoría', 'Precio Base', 'Precio Convenio', 'Costo', 'Duración', 'Requiere Lab', 'Activo'];
    const rows = services.map(s => [
      s.code,
      s.name,
      s.category,
      s.base_price,
      s.convention_price || '',
      s.cost || '',
      s.duration_minutes || '',
      s.requires_lab ? 'Sí' : 'No',
      s.is_active ? 'Activo' : 'Inactivo'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo_servicios.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: "Catálogo exportado a CSV" });
  };

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = services.filter(s => s.is_active);
    const categories = [...new Set(services.map(s => s.category))];
    const avgPrice = active.length > 0 
      ? active.reduce((sum, s) => sum + s.base_price, 0) / active.length 
      : 0;
    const withLab = active.filter(s => s.requires_lab).length;
    
    return { active: active.length, categories: categories.length, avgPrice, withLab };
  }, [services]);

  const categoryGroups = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      if (!groups[service.category]) groups[service.category] = [];
      groups[service.category].push(service);
    });
    return groups;
  }, [filteredServices]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Catálogo de Servicios
          </h1>
          <p className="text-muted-foreground">Gestión unificada de servicios, precios y aranceles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Servicios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Filter className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-xs text-muted-foreground">Categorías</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.avgPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Precio Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FlaskConical className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withLab}</p>
                <p className="text-xs text-muted-foreground">Requieren Lab</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="pricing">Arancel de Precios</TabsTrigger>
          <TabsTrigger value="categories">Por Categoría</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio Base</TableHead>
                  <TableHead className="text-right">P. Convenio</TableHead>
                  <TableHead className="text-center">Duración</TableHead>
                  <TableHead className="text-center">Lab</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Cargando servicios...
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron servicios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map(service => (
                    <TableRow key={service.id} className={!service.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-sm">{service.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${service.base_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {service.convention_price ? `$${service.convention_price.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.requires_lab ? (
                          <FlaskConical className="w-4 h-4 text-orange-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => handleToggleActive(service)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(service.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Arancel de Precios</CardTitle>
              <CardDescription>Comparativa de precios base vs convenio</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio Normal</TableHead>
                    <TableHead className="text-right">Precio Convenio</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.filter(s => s.is_active).map(service => {
                    const discount = service.convention_price 
                      ? ((service.base_price - service.convention_price) / service.base_price * 100).toFixed(0)
                      : '-';
                    const margin = service.cost
                      ? (((service.base_price - service.cost) / service.base_price) * 100).toFixed(0)
                      : '-';
                    
                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-sm">{service.code}</TableCell>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell><Badge variant="outline">{service.category}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">
                          ${service.base_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {service.convention_price ? `$${service.convention_price.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {discount !== '-' ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              -{discount}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {service.cost ? `$${service.cost.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {margin !== '-' ? (
                            <Badge variant="secondary" className={Number(margin) > 50 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                              {margin}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <div className="grid gap-4">
            {Object.entries(categoryGroups).map(([category, categoryServices]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <Badge>{categoryServices.length} servicios</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        className={`p-3 border rounded-lg ${!service.is_active ? 'opacity-50' : 'hover:border-primary/50'} transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{service.code}</p>
                          </div>
                          <p className="font-bold text-primary">${service.base_price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {service.duration_minutes && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {service.duration_minutes}min
                            </Badge>
                          )}
                          {service.requires_lab && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              <FlaskConical className="w-3 h-3 mr-1" />
                              Lab
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del servicio para el catálogo
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="DIAG-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Consulta Diagnóstico"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del servicio..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Precio Base * ($)</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convention_price">Precio Convenio ($)</Label>
              <Input
                id="convention_price"
                type="number"
                value={formData.convention_price}
                onChange={(e) => setFormData({ ...formData, convention_price: e.target.value })}
                placeholder="450"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Costo ($)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="flex items-center justify-between col-span-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-orange-500" />
                <Label htmlFor="requires_lab">Requiere Laboratorio</Label>
              </div>
              <Switch
                id="requires_lab"
                checked={formData.requires_lab}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_lab: checked })}
              />
            </div>

            <div className="flex items-center justify-between col-span-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <Label htmlFor="is_active">Servicio Activo</Label>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {editingService ? 'Actualizar' : 'Crear Servicio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
