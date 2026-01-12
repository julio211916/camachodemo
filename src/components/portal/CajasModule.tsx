import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Wallet, DollarSign, ArrowUpCircle, ArrowDownCircle, Calculator,
  Clock, CheckCircle2, XCircle, AlertCircle, Plus, Minus, FileText,
  CreditCard, Banknote, Building2, Receipt, TrendingUp, PiggyBank,
  Lock, Unlock, ChevronDown, Search, Filter, Download, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CashMovement {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  referenceType?: string;
  referenceId?: string;
  createdAt: Date;
  createdBy: string;
}

interface CashRegisterState {
  id: string;
  status: 'abierta' | 'cerrada';
  openingAmount: number;
  currentAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  locationId: string;
  movements: CashMovement[];
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'transferencia', label: 'Transferencia', icon: Building2 },
  { value: 'cheque', label: 'Cheque', icon: Receipt },
];

export const CajasModule = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState("caja");
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [movementMethod, setMovementMethod] = useState("efectivo");
  const [closingNotes, setClosingNotes] = useState("");

  // Fetch current cash register
  const { data: cashRegister, isLoading } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Get transactions
        const { data: transactions } = await supabase
          .from('cash_transactions')
          .select('*')
          .eq('cash_register_id', data.id)
          .order('created_at', { ascending: false });
        
        return {
          ...data,
          movements: transactions || [],
          status: data.status === 'open' ? 'abierta' : 'cerrada'
        } as unknown as CashRegisterState;
      }
      return null;
    }
  });

  // Fetch today's closed registers
  const { data: todayRegisters = [] } = useQuery({
    queryKey: ['cash-registers-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('cash_register')
        .select('*')
        .gte('opened_at', today)
        .order('opened_at', { ascending: false });
      return data || [];
    }
  });

  // Open cash register
  const openCashMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase
        .from('cash_register')
        .insert({
          opening_amount: amount,
          status: 'open',
          location_id: 'default',
          opened_by: user?.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      setShowOpenDialog(false);
      setOpeningAmount("");
      toast({ title: "Caja abierta", description: "La caja se ha abierto correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo abrir la caja", variant: "destructive" });
    }
  });

  // Close cash register
  const closeCashMutation = useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes: string }) => {
      if (!cashRegister) return;
      
      const expectedAmount = cashRegister.openingAmount + 
        (cashRegister.movements || []).reduce((sum: number, m: any) => {
          return sum + (m.transaction_type === 'income' ? m.amount : -m.amount);
        }, 0);
      
      const { error } = await supabase
        .from('cash_register')
        .update({
          status: 'closed',
          closing_amount: amount,
          expected_amount: expectedAmount,
          difference: amount - expectedAmount,
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
          notes
        })
        .eq('id', cashRegister.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers-today'] });
      setShowCloseDialog(false);
      setClosingAmount("");
      setClosingNotes("");
      toast({ title: "Caja cerrada", description: "El arqueo se ha completado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo cerrar la caja", variant: "destructive" });
    }
  });

  // Add movement
  const addMovementMutation = useMutation({
    mutationFn: async ({ type, amount, description, method }: { type: string; amount: number; description: string; method: string }) => {
      if (!cashRegister) return;
      
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          cash_register_id: cashRegister.id,
          transaction_type: type === 'ingreso' ? 'income' : 'expense',
          amount,
          description,
          payment_method: method,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      setShowMovementDialog(false);
      setMovementAmount("");
      setMovementDescription("");
      toast({ title: "Movimiento registrado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el movimiento", variant: "destructive" });
    }
  });

  // Calculate totals
  const totals = useMemo(() => {
    if (!cashRegister?.movements) return { ingresos: 0, egresos: 0, saldo: (cashRegister as any)?.opening_amount || 0 };
    
    const ingresos = cashRegister.movements.filter((m: any) => m.transaction_type === 'income').reduce((sum: number, m: any) => sum + m.amount, 0);
    const egresos = cashRegister.movements.filter((m: any) => m.transaction_type === 'expense').reduce((sum: number, m: any) => sum + m.amount, 0);
    const saldo = ((cashRegister as any)?.opening_amount || 0) + ingresos - egresos;
    
    return { ingresos, egresos, saldo };
  }, [cashRegister]);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Módulo de Cajas</h1>
          <p className="text-muted-foreground">Control de efectivo y arqueo diario</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!cashRegister ? (
            <Button onClick={() => setShowOpenDialog(true)} className="gap-2">
              <Unlock className="w-4 h-4" />
              Abrir Caja
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => { setMovementType('ingreso'); setShowMovementDialog(true); }}
                className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Ingreso
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setMovementType('egreso'); setShowMovementDialog(true); }}
                className="gap-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Egreso
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowCloseDialog(true)}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                Cerrar Caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={`${cashRegister ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-gray-50 dark:bg-gray-950/20'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${cashRegister ? 'bg-green-500' : 'bg-gray-400'}`}>
                {cashRegister ? <Unlock className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {cashRegister ? 'Caja Abierta' : 'Caja Cerrada'}
                </h2>
                {cashRegister && (
                  <p className="text-sm text-muted-foreground">
                    Abierta: {format(new Date((cashRegister as any).opened_at), "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>

            {cashRegister && (
              <div className="grid grid-cols-4 gap-8 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Apertura</p>
                  <p className="text-2xl font-bold">${((cashRegister as any).opening_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">+${totals.ingresos.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Egresos</p>
                  <p className="text-2xl font-bold text-red-600">-${totals.egresos.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Actual</p>
                  <p className="text-3xl font-bold text-primary">${totals.saldo.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="caja" className="gap-2">
            <Wallet className="w-4 h-4" />
            Caja Actual
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <Clock className="w-4 h-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="arqueos" className="gap-2">
            <Calculator className="w-4 h-4" />
            Arqueos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="flex-1 mt-4">
          {cashRegister ? (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Movimientos del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(cashRegister.movements || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay movimientos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        (cashRegister.movements || []).map((mov: any) => (
                          <TableRow key={mov.id}>
                            <TableCell className="font-mono">
                              {format(new Date(mov.created_at), 'HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Badge className={mov.transaction_type === 'income' ? 'bg-green-500' : 'bg-red-500'}>
                                {mov.transaction_type === 'income' ? 'Ingreso' : 'Egreso'}
                              </Badge>
                            </TableCell>
                            <TableCell>{mov.description}</TableCell>
                            <TableCell className="capitalize">{mov.payment_method}</TableCell>
                            <TableCell className={`text-right font-semibold ${mov.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.transaction_type === 'income' ? '+' : '-'}${mov.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center">
                <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Caja Cerrada</h3>
                <p className="text-muted-foreground mb-4">Abre la caja para comenzar a registrar movimientos</p>
                <Button onClick={() => setShowOpenDialog(true)}>Abrir Caja</Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="flex-1 mt-4">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRegisters.map((reg: any) => (
                    <TableRow key={reg.id}>
                      <TableCell>{format(new Date(reg.opened_at), "d/M/yy HH:mm")}</TableCell>
                      <TableCell>${reg.opening_amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>${reg.closing_amount?.toLocaleString() || '-'}</TableCell>
                      <TableCell>${reg.expected_amount?.toLocaleString() || '-'}</TableCell>
                      <TableCell className={reg.difference > 0 ? 'text-green-600' : reg.difference < 0 ? 'text-red-600' : ''}>
                        {reg.difference !== null ? `$${reg.difference?.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reg.status === 'open' ? 'default' : 'secondary'}>
                          {reg.status === 'open' ? 'Abierta' : 'Cerrada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arqueos" className="flex-1 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Día</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Ingresos</span>
                  <span className="font-bold text-green-600">${totals.ingresos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Egresos</span>
                  <span className="font-bold text-red-600">${totals.egresos.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Balance</span>
                  <span className="font-bold">${(totals.ingresos - totals.egresos).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {PAYMENT_METHODS.map(method => {
                  const total = (cashRegister?.movements || [])
                    .filter((m: any) => m.payment_method === method.value && m.transaction_type === 'income')
                    .reduce((sum: number, m: any) => sum + m.amount, 0);
                  
                  return (
                    <div key={method.value} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <method.icon className="w-4 h-4 text-muted-foreground" />
                        <span>{method.label}</span>
                      </div>
                      <span className="font-medium">${total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Open Cash Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>Ingresa el monto inicial en efectivo</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Monto de Apertura</Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9 text-2xl h-14"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => openCashMutation.mutate(Number(openingAmount))}
              disabled={!openingAmount || openCashMutation.isPending}
            >
              Abrir Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja - Arqueo</DialogTitle>
            <DialogDescription>Cuenta el efectivo y registra el cierre</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo esperado</p>
              <p className="text-3xl font-bold">${totals.saldo.toLocaleString()}</p>
            </div>
            <div>
              <Label>Monto Contado</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9 text-2xl h-14"
                />
              </div>
            </div>
            {closingAmount && (
              <div className={`p-4 rounded-lg ${Number(closingAmount) === totals.saldo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p className="font-medium">
                  Diferencia: ${(Number(closingAmount) - totals.saldo).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <Label>Notas</Label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Observaciones del cierre..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={() => closeCashMutation.mutate({ amount: Number(closingAmount), notes: closingNotes })}
              disabled={!closingAmount || closeCashMutation.isPending}
            >
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={movementType === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
              {movementType === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Monto</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9 text-xl"
                />
              </div>
            </div>
            <div>
              <Label>Método de Pago</Label>
              <Select value={movementMethod} onValueChange={setMovementMethod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="w-4 h-4" />
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
                placeholder="Concepto del movimiento..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>Cancelar</Button>
            <Button 
              className={movementType === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={() => addMovementMutation.mutate({
                type: movementType,
                amount: Number(movementAmount),
                description: movementDescription,
                method: movementMethod
              })}
              disabled={!movementAmount || !movementDescription || addMovementMutation.isPending}
            >
              Registrar {movementType === 'ingreso' ? 'Ingreso' : 'Egreso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CajasModule;
