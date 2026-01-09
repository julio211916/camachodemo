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
import { Loader2, Plus, Receipt, TrendingDown, Calendar, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  expense_date: string;
  location_id: string | null;
  created_at: string;
}

const expenseCategories = [
  { value: "nomina", label: "Nómina", icon: "👥" },
  { value: "materiales", label: "Materiales Dentales", icon: "🦷" },
  { value: "renta", label: "Renta", icon: "🏠" },
  { value: "servicios", label: "Servicios (Luz, Agua, Internet)", icon: "💡" },
  { value: "mantenimiento", label: "Mantenimiento", icon: "🔧" },
  { value: "laboratorio", label: "Laboratorio", icon: "🔬" },
  { value: "marketing", label: "Marketing/Publicidad", icon: "📢" },
  { value: "seguros", label: "Seguros", icon: "🛡️" },
  { value: "impuestos", label: "Impuestos", icon: "📋" },
  { value: "equipo", label: "Equipo Médico", icon: "🏥" },
  { value: "limpieza", label: "Limpieza", icon: "🧹" },
  { value: "otros", label: "Otros", icon: "📦" },
];

export const ExpensesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    payment_method: "efectivo",
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('expenses').insert({
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        payment_method: form.payment_method,
        expense_date: form.expense_date,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Gasto registrado" });
      setShowNew(false);
      setForm({
        category: "",
        description: "",
        amount: "",
        payment_method: "efectivo",
        expense_date: format(new Date(), 'yyyy-MM-dd'),
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el gasto", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Gasto eliminado" });
    },
  });

  const filteredExpenses = expenses?.filter(e => categoryFilter === "all" || e.category === categoryFilter);

  const totalExpenses = filteredExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const expensesByCategory = expenseCategories.map(cat => ({
    ...cat,
    total: expenses?.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0) || 0,
  })).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gastos del Período</p>
                  <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                  className="w-36"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                  className="w-36"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Receipt className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{expenses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Registros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowNew(true)}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Plus className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-lg font-semibold">Nuevo Gasto</p>
                <p className="text-sm text-muted-foreground">Registrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Category */}
      {expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {expensesByCategory.map(cat => (
                <div
                  key={cat.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${categoryFilter === cat.value ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  <p className="text-lg font-bold">${cat.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {((cat.total / totalExpenses) * 100).toFixed(1)}% del total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Gastos
          </CardTitle>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {expenseCategories.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses?.map(expense => {
                const cat = expenseCategories.find(c => c.value === expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.expense_date), "d MMM", { locale: es })}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {cat?.icon} {cat?.label || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="capitalize">{expense.payment_method}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      -${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => deleteMutation.mutate(expense.id)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!filteredExpenses || filteredExpenses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay gastos registrados en este período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Expense Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Categoría *</label>
              <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción *</label>
              <Input
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detalle del gasto"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Monto *</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm(p => ({ ...p, expense_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={form.payment_method} onValueChange={(v) => setForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.category || !form.description || !form.amount || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
