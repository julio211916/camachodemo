import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  MessageSquare, 
  Phone, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Settings,
  Loader2,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { format, addHours, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ReminderSettings {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderHours: number;
  autoSend: boolean;
}

interface ScheduledReminder {
  id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
  type: 'whatsapp' | 'sms' | 'email';
}

export const AppointmentReminderSystem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ReminderSettings>({
    whatsappEnabled: true,
    smsEnabled: false,
    emailEnabled: true,
    reminderHours: 24,
    autoSend: true,
  });
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch upcoming appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['upcoming-appointments-reminders'],
    queryFn: async () => {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', tomorrow)
        .lte('appointment_date', nextWeek)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const groups: Record<string, typeof appointments> = {};
    appointments.forEach(apt => {
      if (!groups[apt.appointment_date]) {
        groups[apt.appointment_date] = [];
      }
      groups[apt.appointment_date].push(apt);
    });
    return groups;
  }, [appointments]);

  // Stats
  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => !a.reminder_sent).length,
    sent: appointments.filter(a => a.reminder_sent).length,
    today: appointments.filter(a => a.appointment_date === format(addDays(new Date(), 1), 'yyyy-MM-dd')).length,
  }), [appointments]);

  // Send individual reminder
  const sendReminder = async (appointment: any, type: 'whatsapp' | 'sms') => {
    setSendingReminder(appointment.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: {
          appointmentId: appointment.id,
          patientPhone: appointment.patient_phone,
          patientName: appointment.patient_name,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          serviceName: appointment.service_name,
          locationName: appointment.location_name,
          reminderType: type,
        },
      });

      if (error) throw error;

      // If WhatsApp, open the link
      if (type === 'whatsapp' && data?.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }

      // Update appointment reminder status
      await supabase
        .from('appointments')
        .update({ reminder_sent: new Date().toISOString() })
        .eq('id', appointment.id);

      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments-reminders'] });

      toast({
        title: "Recordatorio enviado",
        description: `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} enviado a ${appointment.patient_name}`,
      });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el recordatorio",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  // Send bulk reminders
  const sendBulkReminders = async () => {
    const appointmentsToRemind = selectedAppointments.length > 0 
      ? appointments.filter(a => selectedAppointments.includes(a.id))
      : appointments.filter(a => !a.reminder_sent);

    let sent = 0;
    let failed = 0;

    for (const apt of appointmentsToRemind) {
      try {
        await sendReminder(apt, settings.whatsappEnabled ? 'whatsapp' : 'sms');
        sent++;
      } catch {
        failed++;
      }
    }

    toast({
      title: "Envío masivo completado",
      description: `${sent} recordatorios enviados, ${failed} fallidos`,
    });

    setSelectedAppointments([]);
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedAppointments(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(a => a.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Citas próximas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Sin recordatorio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Recordatorios enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Para mañana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recordatorios de Citas
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button 
              onClick={sendBulkReminders}
              disabled={appointments.filter(a => !a.reminder_sent).length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar {selectedAppointments.length > 0 ? `(${selectedAppointments.length})` : 'Todos'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Por Fecha</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedAppointments.length === appointments.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <input 
                          type="checkbox" 
                          checked={selectedAppointments.includes(apt.id)}
                          onChange={() => toggleSelection(apt.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{apt.patient_name}</TableCell>
                      <TableCell>{apt.patient_phone}</TableCell>
                      <TableCell>
                        {format(parseISO(apt.appointment_date), "d MMM", { locale: es })}
                      </TableCell>
                      <TableCell>{apt.appointment_time}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{apt.service_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {apt.reminder_sent ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendReminder(apt, 'whatsapp')}
                            disabled={sendingReminder === apt.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {sendingReminder === apt.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <MessageSquare className="w-4 h-4 mr-1" />
                                WhatsApp
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendReminder(apt, 'sms')}
                            disabled={sendingReminder === apt.id}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {appointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay citas próximas para recordar</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar">
              <div className="space-y-4">
                {Object.entries(appointmentsByDate).map(([date, apts]) => (
                  <Card key={date}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
                        <Badge variant="secondary" className="ml-auto">
                          {apts.length} citas
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {apts.map((apt) => (
                          <div 
                            key={apt.id}
                            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="font-bold">{apt.appointment_time}</p>
                              </div>
                              <div>
                                <p className="font-medium">{apt.patient_name}</p>
                                <p className="text-sm text-muted-foreground">{apt.service_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {apt.reminder_sent ? (
                                <Badge className="bg-green-500">Recordado</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => sendReminder(apt, 'whatsapp')}
                                  disabled={sendingReminder === apt.id}
                                >
                                  {sendingReminder === apt.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-1" />
                                      Recordar
                                    </>
                                  )}
                                </Button>
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
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Recordatorios</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Canales de Envío</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <Label>WhatsApp</Label>
                </div>
                <Switch 
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(v) => setSettings({...settings, whatsappEnabled: v})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <Label>SMS</Label>
                </div>
                <Switch 
                  checked={settings.smsEnabled}
                  onCheckedChange={(v) => setSettings({...settings, smsEnabled: v})}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Tiempo de Anticipación</h4>
              <Select 
                value={settings.reminderHours.toString()}
                onValueChange={(v) => setSettings({...settings, reminderHours: parseInt(v)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 horas antes</SelectItem>
                  <SelectItem value="24">24 horas antes</SelectItem>
                  <SelectItem value="48">48 horas antes</SelectItem>
                  <SelectItem value="72">72 horas antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Envío Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorios automáticamente
                </p>
              </div>
              <Switch 
                checked={settings.autoSend}
                onCheckedChange={(v) => setSettings({...settings, autoSend: v})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast({ title: "Configuración guardada" });
              setShowSettings(false);
            }}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
