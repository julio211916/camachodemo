import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, FileText, RotateCcw, Trash2, DollarSign, 
  Search, Filter, Download, Printer, Plus, Eye, MoreVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  total: number;
  status: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
}

interface PatientBillingTabProps {
  patientId: string;
  invoices: Invoice[];
  stats: {
    totalCost: number;
    totalPaid: number;
    balance: number;
    pendingBalance: number;
    paymentProgress: number;
  };
}

export const PatientBillingTab = ({ patientId, invoices, stats }: PatientBillingTabProps) => {
  const [activeSection, setActiveSection] = useState("pagos");
  const [monthFilter, setMonthFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'paid': 'bg-green-500/10 text-green-600',
      'pending': 'bg-yellow-500/10 text-yellow-600',
      'partial': 'bg-blue-500/10 text-blue-600',
      'overdue': 'bg-red-500/10 text-red-600',
      'cancelled': 'bg-gray-500/10 text-gray-600'
    };
    const labels: Record<string, string> = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'partial': 'Parcial',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    };
    return <Badge className={styles[status]}>{labels[status] || status}</Badge>;
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!showCancelled && inv.status === 'cancelled') return false;
    if (searchQuery && !inv.number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Facturado</p>
                <p className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pagado</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalPaid.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">${stats.pendingBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold">{stats.paymentProgress.toFixed(0)}%</p>
                <Progress value={stats.paymentProgress} className="h-1.5 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList>
          <TabsTrigger value="pagos" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="w-4 h-4" />
            Documentos emitidos
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Devoluciones
          </TabsTrigger>
          <TabsTrigger value="eliminados" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Pagos Eliminados
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagos" className="mt-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                <SelectItem value="current">Este mes</SelectItem>
                <SelectItem value="last">Mes pasado</SelectItem>
                <SelectItem value="last3">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showCancelled ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCancelled(!showCancelled)}
            >
              Mostrar anuladas
            </Button>
          </div>

          {/* Payments Table */}
          {filteredInvoices.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No hay pagos registrados</p>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Factura</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.number}</TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {invoice.items?.map((item, i) => (
                            <span key={i} className="text-sm">
                              {item.description}{i < invoice.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-6">
          <Card className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay documentos emitidos</p>
          </Card>
        </TabsContent>

        <TabsContent value="devoluciones" className="mt-6">
          <Card className="p-8 text-center">
            <RotateCcw className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay devoluciones registradas</p>
          </Card>
        </TabsContent>

        <TabsContent value="eliminados" className="mt-6">
          <Card className="p-8 text-center">
            <Trash2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay pagos eliminados</p>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Balance General</CardTitle>
              <CardDescription>Resumen de cuenta del paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span>Total facturado</span>
                <span className="font-medium">${stats.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Total pagado</span>
                <span className="font-medium text-green-600">${stats.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Descuentos aplicados</span>
                <span className="font-medium">$0</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Saldo pendiente</span>
                <span className={stats.pendingBalance > 0 ? "text-yellow-600" : "text-green-600"}>
                  ${stats.pendingBalance.toLocaleString()}
                </span>
              </div>
              <Progress value={stats.paymentProgress} className="h-3 mt-4" />
              <p className="text-sm text-muted-foreground text-center">
                {stats.paymentProgress.toFixed(1)}% del total pagado
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
