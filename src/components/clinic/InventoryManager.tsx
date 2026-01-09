import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Package, AlertTriangle, ArrowDown, ArrowUp, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  unit_cost: number | null;
  supplier: string | null;
  location_id: string | null;
  created_at: string;
}

interface InventoryMovement {
  id: string;
  inventory_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
}

const categories = [
  "Materiales de Restauración",
  "Instrumental",
  "Anestésicos",
  "Desechables",
  "Ortododoncia",
  "Endodoncia",
  "Cirugía",
  "Profilaxis",
  "Prótesis",
  "Radiología",
  "Oficina",
  "Limpieza",
  "Otro",
];

export const InventoryManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    quantity: "0",
    min_stock: "5",
    unit: "unidad",
    unit_cost: "",
    supplier: "",
  });

  const [movementForm, setMovementForm] = useState({
    movement_type: "entrada",
    quantity: "",
    reason: "",
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const { data: movements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('inventory').insert({
        name: form.name,
        description: form.description || null,
        category: form.category,
        quantity: parseInt(form.quantity) || 0,
        min_stock: parseInt(form.min_stock) || 5,
        unit: form.unit,
        unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
        supplier: form.supplier || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: "Producto agregado" });
      setShowNew(false);
      setForm({ name: "", description: "", category: "", quantity: "0", min_stock: "5", unit: "unidad", unit_cost: "", supplier: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo agregar", variant: "destructive" });
    },
  });

  const movementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      const { data: user } = await supabase.auth.getUser();
      const qty = parseInt(movementForm.quantity);
      
      // Create movement record
      const { error: movError } = await supabase.from('inventory_movements').insert({
        inventory_id: selectedItem.id,
        movement_type: movementForm.movement_type,
        quantity: qty,
        reason: movementForm.reason || null,
        performed_by: user.user?.id,
      });
      if (movError) throw movError;

      // Update quantity
      const newQuantity = movementForm.movement_type === 'entrada' 
        ? selectedItem.quantity + qty 
        : selectedItem.quantity - qty;
      
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: Math.max(0, newQuantity) })
        .eq('id', selectedItem.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast({ title: "Movimiento registrado" });
      setShowMovement(false);
      setMovementForm({ movement_type: "entrada", quantity: "", reason: "" });
      setSelectedItem(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: "Producto eliminado" });
    },
  });

  const filteredItems = items?.filter(item => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = items?.filter(item => item.quantity <= item.min_stock) || [];
  const totalValue = items?.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{items?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? "border-orange-500" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">💰</div>
              <div>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowNew(true)}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Plus className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-lg font-semibold">Agregar</p>
                <p className="text-sm text-muted-foreground">Nuevo producto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="outline" className="border-orange-500 text-orange-700">
                  {item.name}: {item.quantity} {item.unit}(s)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Mín.</TableHead>
                    <TableHead>Costo Unit.</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map(item => (
                    <TableRow key={item.id} className={item.quantity <= item.min_stock ? "bg-orange-50 dark:bg-orange-950/20" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                      <TableCell>
                        <span className={item.quantity <= item.min_stock ? "text-orange-600 font-bold" : ""}>
                          {item.quantity} {item.unit}(s)
                        </span>
                      </TableCell>
                      <TableCell>{item.min_stock}</TableCell>
                      <TableCell>{item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : "-"}</TableCell>
                      <TableCell>{item.supplier || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setSelectedItem(item); setMovementForm({ ...movementForm, movement_type: "entrada" }); setShowMovement(true); }}
                          >
                            <ArrowDown className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setSelectedItem(item); setMovementForm({ ...movementForm, movement_type: "salida" }); setShowMovement(true); }}
                          >
                            <ArrowUp className="w-4 h-4 text-red-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Razón</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements?.map(mov => {
                    const item = items?.find(i => i.id === mov.inventory_id);
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>{format(new Date(mov.created_at), "d MMM yyyy HH:mm", { locale: es })}</TableCell>
                        <TableCell>
                          <Badge className={mov.movement_type === 'entrada' ? 'bg-green-500' : mov.movement_type === 'salida' ? 'bg-red-500' : 'bg-blue-500'}>
                            {mov.movement_type === 'entrada' ? '+ Entrada' : mov.movement_type === 'salida' ? '- Salida' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mov.quantity} {item?.unit || 'unidad'}(s) - {item?.name || 'Producto eliminado'}
                        </TableCell>
                        <TableCell>{mov.reason || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Product Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Categoría *</label>
              <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Unidad</label>
              <Input value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} className="mt-1" placeholder="Ej: unidad, caja, ml" />
            </div>
            <div>
              <label className="text-sm font-medium">Cantidad Inicial</label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Stock Mínimo</label>
              <Input type="number" value={form.min_stock} onChange={(e) => setForm(p => ({ ...p, min_stock: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Costo Unitario</label>
              <Input type="number" value={form.unit_cost} onChange={(e) => setForm(p => ({ ...p, unit_cost: e.target.value }))} className="mt-1" placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium">Proveedor</label>
              <Input value={form.supplier} onChange={(e) => setForm(p => ({ ...p, supplier: e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.category || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovement} onOpenChange={setShowMovement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementForm.movement_type === 'entrada' ? 'Entrada de' : 'Salida de'} {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Movimiento</label>
              <Select value={movementForm.movement_type} onValueChange={(v) => setMovementForm(p => ({ ...p, movement_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Cantidad *</label>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm(p => ({ ...p, quantity: e.target.value }))}
                className="mt-1"
                placeholder={`Stock actual: ${selectedItem?.quantity || 0}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Razón</label>
              <Input
                value={movementForm.reason}
                onChange={(e) => setMovementForm(p => ({ ...p, reason: e.target.value }))}
                className="mt-1"
                placeholder="Ej: Compra, Uso en paciente, Vencido..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovement(false)}>Cancelar</Button>
            <Button onClick={() => movementMutation.mutate()} disabled={!movementForm.quantity || movementMutation.isPending}>
              {movementMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
