import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, FileText, Receipt, Download, CreditCard, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const PatientPortalView = () => {
  const { user, profile } = useAuth();

  // Fetch patient invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['patient-invoices', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch treatment plans
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatment-plans', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch upcoming appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-upcoming-appointments', user?.email],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', user?.email || '')
        .gte('appointment_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true });
      return data || [];
    },
    enabled: !!user?.email,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      paid: { variant: "default", label: "Pagada" },
      partial: { variant: "outline", label: "Parcial" },
      overdue: { variant: "destructive", label: "Vencida" },
      confirmed: { variant: "default", label: "Confirmada" },
      in_progress: { variant: "secondary", label: "En Progreso" },
      completed: { variant: "default", label: "Completado" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mi Portal de Paciente</h2>
          <p className="text-muted-foreground">Bienvenido, {profile?.full_name || 'Paciente'}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próximas Citas</p>
              <p className="text-xl font-bold">{appointments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tratamientos Activos</p>
              <p className="text-xl font-bold">{treatments.filter(t => t.status === 'in_progress').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Receipt className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Facturas Pagadas</p>
              <p className="text-xl font-bold">{invoices.filter(i => i.status === 'paid').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
              <p className="text-xl font-bold">
                ${invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Citas
              </CardTitle>
              <CardDescription>Tus citas programadas</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes citas programadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center p-2 bg-primary/10 rounded-lg min-w-[60px]">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.appointment_date), 'MMM', { locale: es }).toUpperCase()}
                          </p>
                          <p className="text-xl font-bold">{format(new Date(apt.appointment_date), 'd')}</p>
                        </div>
                        <div>
                          <p className="font-medium">{apt.service_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {apt.appointment_time}
                            <span className="mx-1">•</span>
                            {apt.location_name}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mis Tratamientos
              </CardTitle>
              <CardDescription>Historial y progreso de tratamientos</CardDescription>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes tratamientos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          <p className="text-sm text-muted-foreground">{treatment.description}</p>
                          {treatment.diagnosis && (
                            <p className="text-sm mt-1"><span className="font-medium">Diagnóstico:</span> {treatment.diagnosis}</p>
                          )}
                        </div>
                        {getStatusBadge(treatment.status || 'pending')}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span>Inicio: {format(new Date(treatment.start_date), 'dd/MM/yyyy')}</span>
                        {treatment.end_date && (
                          <span>Fin: {format(new Date(treatment.end_date), 'dd/MM/yyyy')}</span>
                        )}
                        {treatment.cost && (
                          <span className="font-medium text-foreground">${treatment.cost.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Mis Facturas
              </CardTitle>
              <CardDescription>Historial de facturación y pagos</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes facturas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Factura #{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${invoice.total?.toLocaleString()}</p>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {invoice.invoice_items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.description}</span>
                              <span>${item.total?.toLocaleString()}</span>
                            </div>
                          ))}
                          {invoice.invoice_items.length > 3 && (
                            <p className="text-sm text-muted-foreground">+{invoice.invoice_items.length - 3} items más</p>
                          )}
                        </div>
                      )}
                      {invoice.pdf_url && (
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};