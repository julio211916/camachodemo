import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, FileText, DollarSign, CreditCard, Printer, Download, CheckCircle, Clock, AlertCircle, Mail, Send } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  patient_email: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  treatment_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  installment_number: number | null;
  total_installments: number | null;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  partial: { label: "Parcial", color: "bg-blue-500", icon: AlertCircle },
  paid: { label: "Pagada", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "bg-red-500", icon: null },
};

const paymentMethods = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheque", label: "Cheque" },
];

export const InvoicingModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [form, setForm] = useState({
    patient_name: "",
    patient_email: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    tax_rate: 16,
    discount: 0,
    notes: "",
    due_date: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "efectivo",
    installment_number: "",
    total_installments: "",
    notes: "",
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments', selectedInvoice?.id],
    queryFn: async () => {
      if (!selectedInvoice) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', selectedInvoice.id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!selectedInvoice,
  });

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ND-${year}${month}-${random}`;
  };

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (form.tax_rate / 100);
    const total = subtotal + taxAmount - form.discount;
    return { subtotal, taxAmount, total };
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { subtotal, taxAmount, total } = calculateTotals();
      const invoiceNumber = generateInvoiceNumber();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: user.user?.id || '00000000-0000-0000-0000-000000000000',
          patient_name: form.patient_name,
          patient_email: form.patient_email || null,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: form.discount,
          total,
          due_date: form.due_date || null,
          notes: form.notes || null,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = form.items.filter(i => i.description && i.unit_price > 0).map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(items);
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: "Factura creada", description: "La factura ha sido generada correctamente" });
      setShowNew(false);
      setForm({
        patient_name: "",
        patient_email: "",
        items: [{ description: "", quantity: 1, unit_price: 0 }],
        tax_rate: 16,
        discount: 0,
        notes: "",
        due_date: "",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la factura", variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) return;
      const { data: user } = await supabase.auth.getUser();
      const amount = parseFloat(paymentForm.amount);

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        invoice_id: selectedInvoice.id,
        amount,
        payment_method: paymentForm.payment_method,
        installment_number: paymentForm.installment_number ? parseInt(paymentForm.installment_number) : null,
        total_installments: paymentForm.total_installments ? parseInt(paymentForm.total_installments) : null,
        notes: paymentForm.notes || null,
        received_by: user.user?.id,
      });

      if (paymentError) throw paymentError;

      // Calculate total paid
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', selectedInvoice.id);

      const totalPaid = (allPayments || []).reduce((sum, p) => sum + p.amount, 0) + amount;

      // Update invoice status
      let newStatus = selectedInvoice.status;
      if (totalPaid >= selectedInvoice.total) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', selectedInvoice.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments', selectedInvoice?.id] });
      toast({ title: "Pago registrado" });
      setShowPayment(false);
      setPaymentForm({ amount: "", payment_method: "efectivo", installment_number: "", total_installments: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el pago", variant: "destructive" });
    },
  });

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      setForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const sendInvoiceEmail = async (invoice: Invoice) => {
    if (!invoice.patient_email) {
      toast({ title: "Error", description: "El paciente no tiene email registrado", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          patientEmail: invoice.patient_email,
          patientName: invoice.patient_name,
          invoiceNumber: invoice.invoice_number,
          total: invoice.total,
          subtotal: invoice.subtotal,
          taxAmount: invoice.tax_amount,
          discountAmount: invoice.discount_amount || 0,
          dueDate: invoice.due_date ? format(new Date(invoice.due_date), "d 'de' MMMM, yyyy", { locale: es }) : null,
          items: [],
        },
      });

      if (error) throw error;
      toast({ title: "Email enviado", description: `Factura enviada a ${invoice.patient_email}` });
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      toast({ title: "Error", description: "No se pudo enviar el email", variant: "destructive" });
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Error", description: "No se pudo abrir la ventana de impresión", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
          .invoice-info { text-align: right; }
          .invoice-number { font-size: 20px; font-weight: bold; }
          .patient-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8fafc; }
          .totals { text-align: right; }
          .totals td { padding: 8px 12px; }
          .total-row { font-size: 18px; font-weight: bold; background: #f0f9ff; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          .status { padding: 4px 12px; border-radius: 4px; display: inline-block; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-partial { background: #dbeafe; color: #1e40af; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🦷 NovellDent</div>
            <p>Clínica Dental</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">Factura ${invoice.invoice_number}</div>
            <p>Fecha: ${format(new Date(invoice.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
            <span class="status status-${invoice.status}">${statusConfig[invoice.status]?.label || invoice.status}</span>
          </div>
        </div>
        
        <div class="patient-info">
          <h3>Datos del Paciente</h3>
          <p><strong>Nombre:</strong> ${invoice.patient_name}</p>
          ${invoice.patient_email ? `<p><strong>Email:</strong> ${invoice.patient_email}</p>` : ''}
          ${invoice.due_date ? `<p><strong>Fecha de Vencimiento:</strong> ${format(new Date(invoice.due_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio Unit.</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4">Tratamientos y servicios dentales</td>
            </tr>
          </tbody>
        </table>

        <table class="totals" style="width: 300px; margin-left: auto;">
          <tr>
            <td>Subtotal:</td>
            <td>$${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>IVA:</td>
            <td>$${invoice.tax_amount.toFixed(2)}</td>
          </tr>
          ${invoice.discount_amount > 0 ? `
          <tr>
            <td>Descuento:</td>
            <td>-$${invoice.discount_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>Total:</td>
            <td>$${invoice.total.toFixed(2)}</td>
          </tr>
        </table>

        ${invoice.notes ? `
        <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <strong>Notas:</strong>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Gracias por su preferencia</p>
          <p>NovellDent - Tu sonrisa, nuestra prioridad</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const filteredInvoices = invoices?.filter(inv => statusFilter === "all" || inv.status === statusFilter);

  const stats = {
    total: invoices?.reduce((sum, i) => sum + i.total, 0) || 0,
    pending: invoices?.filter(i => i.status === 'pending' || i.status === 'partial').reduce((sum, i) => sum + i.total, 0) || 0,
    paid: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Facturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">${stats.paid.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Cobrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">${stats.pending.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowNew(true)}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Plus className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-lg font-semibold">Nueva Factura</p>
                <p className="text-sm text-muted-foreground">Crear factura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturas
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
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
                <TableHead>Folio</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.map(invoice => {
                const config = statusConfig[invoice.status];
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.patient_name}</TableCell>
                    <TableCell>{format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}</TableCell>
                    <TableCell className="font-semibold">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => generatePDF(invoice)}
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {invoice.patient_email && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => sendInvoiceEmail(invoice)}
                            title="Enviar por email"
                          >
                            <Mail className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setSelectedInvoice(invoice); setShowPayment(true); }}
                          >
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!filteredInvoices || filteredInvoices.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay facturas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Invoice Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Paciente *</label>
                <Input
                  value={form.patient_name}
                  onChange={(e) => setForm(p => ({ ...p, patient_name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.patient_email}
                  onChange={(e) => setForm(p => ({ ...p, patient_email: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Conceptos</label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-6"
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      placeholder="Precio"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="col-span-1"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">IVA (%)</label>
                <Input
                  type="number"
                  value={form.tax_rate}
                  onChange={(e) => setForm(p => ({ ...p, tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descuento ($)</label>
                <Input
                  type="number"
                  value={form.discount || ''}
                  onChange={(e) => setForm(p => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Vencimiento</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>IVA ({form.tax_rate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              {form.discount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Descuento:</span>
                  <span>-${form.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.patient_name || form.items.every(i => !i.description) || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago - {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">Total Factura: <strong>${selectedInvoice?.total.toFixed(2)}</strong></p>
            </div>
            <div>
              <label className="text-sm font-medium">Monto *</label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                placeholder={`Máximo: ${selectedInvoice?.total.toFixed(2)}`}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cuota #</label>
                <Input
                  type="number"
                  value={paymentForm.installment_number}
                  onChange={(e) => setPaymentForm(p => ({ ...p, installment_number: e.target.value }))}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total Cuotas</label>
                <Input
                  type="number"
                  value={paymentForm.total_installments}
                  onChange={(e) => setPaymentForm(p => ({ ...p, total_installments: e.target.value }))}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>Cancelar</Button>
            <Button onClick={() => paymentMutation.mutate()} disabled={!paymentForm.amount || paymentMutation.isPending}>
              {paymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
