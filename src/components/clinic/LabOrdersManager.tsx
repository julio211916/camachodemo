import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, FlaskConical, Truck, CheckCircle, Clock, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LabOrder {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string | null;
  lab_name: string;
  work_type: string;
  description: string | null;
  color_shade: string | null;
  status: string;
  estimated_date: string | null;
  delivery_date: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

const workTypes = [
  "Corona Metal-Porcelana",
  "Corona Zirconio",
  "Corona E-max",
  "Puente Fijo",
  "Prótesis Parcial Removible",
  "Prótesis Total",
  "Carillas",
  "Incrustación",
  "Férula Oclusal",
  "Retenedor Ortodoncia",
  "Modelo de Estudio",
  "Otro",
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  in_progress: { label: "En Proceso", color: "bg-blue-500", icon: FlaskConical },
  ready: { label: "Listo", color: "bg-green-500", icon: CheckCircle },
  delivered: { label: "Entregado", color: "bg-gray-500", icon: Package },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: null },
};

export const LabOrdersManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({
    patient_name: "",
    lab_name: "",
    work_type: "",
    description: "",
    color_shade: "",
    estimated_date: "",
    cost: "",
    notes: "",
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LabOrder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('lab_orders').insert({
        patient_id: user.user?.id || '00000000-0000-0000-0000-000000000000',
        patient_name: form.patient_name,
        doctor_id: user.user?.id,
        lab_name: form.lab_name,
        work_type: form.work_type,
        description: form.description || null,
        color_shade: form.color_shade || null,
        estimated_date: form.estimated_date || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      toast({ title: "Orden creada", description: "Pedido de laboratorio registrado" });
      setShowNew(false);
      setForm({ patient_name: "", lab_name: "", work_type: "", description: "", color_shade: "", estimated_date: "", cost: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la orden", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'delivered') {
        updates.delivery_date = new Date().toISOString().split('T')[0];
      }
      const { error } = await supabase.from('lab_orders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      toast({ title: "Estado actualizado" });
    },
  });

  const filteredOrders = orders?.filter(o => statusFilter === "all" || o.status === statusFilter);

  const stats = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
    ready: orders?.filter(o => o.status === 'ready').length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><FlaskConical className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-sm text-muted-foreground">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm text-muted-foreground">Listos para Entregar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowNew(true)}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Plus className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-lg font-semibold">Nueva Orden</p>
                <p className="text-sm text-muted-foreground">Crear pedido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Órdenes de Laboratorio
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead>Trabajo</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Fecha Est.</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map(order => {
                const config = statusConfig[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patient_name}</TableCell>
                    <TableCell>{order.lab_name}</TableCell>
                    <TableCell>{order.work_type}</TableCell>
                    <TableCell>{order.color_shade || "-"}</TableCell>
                    <TableCell>
                      {order.estimated_date ? format(new Date(order.estimated_date), "d MMM", { locale: es }) : "-"}
                    </TableCell>
                    <TableCell>{order.cost ? `$${order.cost.toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, c]) => (
                            <SelectItem key={key} value={key}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!filteredOrders || filteredOrders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay órdenes de laboratorio
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Order Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Laboratorio</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Paciente *</label>
              <Input
                value={form.patient_name}
                onChange={(e) => setForm(p => ({ ...p, patient_name: e.target.value }))}
                placeholder="Nombre del paciente"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Laboratorio *</label>
              <Input
                value={form.lab_name}
                onChange={(e) => setForm(p => ({ ...p, lab_name: e.target.value }))}
                placeholder="Nombre del laboratorio"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Trabajo *</label>
              <Select value={form.work_type} onValueChange={(v) => setForm(p => ({ ...p, work_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {workTypes.map(wt => <SelectItem key={wt} value={wt}>{wt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Color/Tono</label>
              <Input
                value={form.color_shade}
                onChange={(e) => setForm(p => ({ ...p, color_shade: e.target.value }))}
                placeholder="Ej: A2, B1, Bleach"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha Estimada</label>
              <Input
                type="date"
                value={form.estimated_date}
                onChange={(e) => setForm(p => ({ ...p, estimated_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Costo</label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => setForm(p => ({ ...p, cost: e.target.value }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detalles del trabajo..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Observaciones..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.patient_name || !form.lab_name || !form.work_type || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
