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
import { Loader2, Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CashRegister {
  id: string;
  location_id: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  status: string;
  opened_by: string | null;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

interface CashTransaction {
  id: string;
  cash_register_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export const CashRegisterModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    transaction_type: "ingreso",
    amount: "",
    payment_method: "efectivo",
    description: "",
  });

  const { data: currentRegister, isLoading } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CashRegister | null;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['cash-transactions', currentRegister?.id],
    queryFn: async () => {
      if (!currentRegister) return [];
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('cash_register_id', currentRegister.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CashTransaction[];
    },
    enabled: !!currentRegister,
  });

  const { data: recentRegisters } = useQuery({
    queryKey: ['cash-register-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as CashRegister[];
    },
  });

  const openMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('cash_register').insert({
        location_id: 'main',
        opening_amount: parseFloat(openingAmount) || 0,
        opened_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      toast({ title: "Caja abierta", description: "La caja ha sido abierta correctamente" });
      setShowOpen(false);
      setOpeningAmount("");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo abrir la caja", variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!currentRegister) return;
      const { data: user } = await supabase.auth.getUser();
      const closing = parseFloat(closingAmount) || 0;
      
      // Calculate expected amount
      const ingresos = transactions?.filter(t => t.transaction_type === 'ingreso').reduce((sum, t) => sum + t.amount, 0) || 0;
      const egresos = transactions?.filter(t => t.transaction_type === 'egreso').reduce((sum, t) => sum + t.amount, 0) || 0;
      const expected = currentRegister.opening_amount + ingresos - egresos;
      const difference = closing - expected;

      const { error } = await supabase
        .from('cash_register')
        .update({
          status: 'closed',
          closing_amount: closing,
          expected_amount: expected,
          difference: difference,
          closed_by: user.user?.id,
          closed_at: new Date().toISOString(),
          notes: closeNotes || null,
        })
        .eq('id', currentRegister.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
      toast({ title: "Caja cerrada", description: "El cierre de caja se ha registrado" });
      setShowClose(false);
      setClosingAmount("");
      setCloseNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo cerrar la caja", variant: "destructive" });
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async () => {
      if (!currentRegister) return;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('cash_transactions').insert({
        cash_register_id: currentRegister.id,
        transaction_type: transactionForm.transaction_type,
        amount: parseFloat(transactionForm.amount) || 0,
        payment_method: transactionForm.payment_method,
        description: transactionForm.description || null,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-transactions', currentRegister?.id] });
      toast({ title: "Movimiento registrado" });
      setShowTransaction(false);
      setTransactionForm({ transaction_type: "ingreso", amount: "", payment_method: "efectivo", description: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el movimiento", variant: "destructive" });
    },
  });

  const totalIngresos = transactions?.filter(t => t.transaction_type === 'ingreso').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalEgresos = transactions?.filter(t => t.transaction_type === 'egreso').reduce((sum, t) => sum + t.amount, 0) || 0;
  const balance = (currentRegister?.opening_amount || 0) + totalIngresos - totalEgresos;

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Register Status */}
      {currentRegister ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg"><Unlock className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Apertura</p>
                    <p className="text-xl font-bold">${currentRegister.opening_amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-xl font-bold text-green-600">+${totalIngresos.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Egresos</p>
                    <p className="text-xl font-bold text-red-600">-${totalEgresos.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm opacity-80">Balance Actual</p>
                    <p className="text-xl font-bold">${balance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowTransaction(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Movimiento
            </Button>
            <Button variant="outline" onClick={() => setShowClose(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Cerrar Caja
            </Button>
          </div>

          {/* Today's Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos del Día</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.created_at), "HH:mm")}</TableCell>
                      <TableCell>
                        <Badge className={tx.transaction_type === 'ingreso' ? 'bg-green-500' : 'bg-red-500'}>
                          {tx.transaction_type === 'ingreso' ? '+ Ingreso' : '- Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{tx.payment_method}</TableCell>
                      <TableCell>{tx.description || '-'}</TableCell>
                      <TableCell className={`text-right font-semibold ${tx.transaction_type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.transaction_type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Caja Cerrada</h3>
            <p className="text-muted-foreground mb-4">No hay una caja abierta. Abre la caja para comenzar a registrar movimientos.</p>
            <Button onClick={() => setShowOpen(true)}>
              <Unlock className="w-4 h-4 mr-2" />
              Abrir Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {recentRegisters && recentRegisters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cierres</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Esperado</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegisters.map(reg => (
                  <TableRow key={reg.id}>
                    <TableCell>{format(new Date(reg.closed_at || reg.opened_at), "d MMM yyyy", { locale: es })}</TableCell>
                    <TableCell>${reg.opening_amount.toFixed(2)}</TableCell>
                    <TableCell>${(reg.closing_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>${(reg.expected_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className={`font-semibold ${(reg.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(reg.difference || 0) >= 0 ? '+' : ''}${(reg.difference || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Open Register Dialog */}
      <Dialog open={showOpen} onOpenChange={setShowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Monto de Apertura</label>
            <Input
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Ingresa el efectivo con el que inicias el día</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpen(false)}>Cancelar</Button>
            <Button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>
              {openMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Abrir Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Register Dialog */}
      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">Balance esperado: <strong>${balance.toFixed(2)}</strong></p>
            </div>
            <div>
              <label className="text-sm font-medium">Monto de Cierre (contado)</label>
              <Input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Observaciones del cierre..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClose(false)}>Cancelar</Button>
            <Button onClick={() => closeMutation.mutate()} disabled={!closingAmount || closeMutation.isPending}>
              {closeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransaction} onOpenChange={setShowTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={transactionForm.transaction_type} onValueChange={(v) => setTransactionForm(p => ({ ...p, transaction_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Monto *</label>
              <Input
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={transactionForm.payment_method} onValueChange={(v) => setTransactionForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Motivo del movimiento"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransaction(false)}>Cancelar</Button>
            <Button onClick={() => transactionMutation.mutate()} disabled={!transactionForm.amount || transactionMutation.isPending}>
              {transactionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
