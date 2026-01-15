import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Receipt, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/ContentCard";

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  due_date?: string | null;
}

export const PatientInvoices = ({ invoices }: { invoices: Invoice[] }) => {
  const pending = invoices.filter(i => i.status === 'pending');
  const paid = invoices.filter(i => i.status === 'paid');

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Facturas" subtitle={`${pending.length} pendientes de pago`} />
      
      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" />Pendientes</h3>
          {pending.map(inv => (
            <Card key={inv.id} className="border-yellow-500/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Factura #{inv.invoice_number}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${inv.total.toLocaleString()}</p>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Pendiente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" />Pagadas</h3>
          {paid.slice(0, 5).map(inv => (
            <Card key={inv.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">#{inv.invoice_number}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${inv.total.toLocaleString()}</p>
                    <Badge variant="secondary">Pagada</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {invoices.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />No tienes facturas</CardContent></Card>
      )}
    </div>
  );
};
