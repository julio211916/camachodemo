import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/ContentCard";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  location_name: string;
  status: string;
  notes?: string;
}

export const PatientAppointments = ({ appointments }: { appointments: Appointment[] }) => {
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.appointment_date) < new Date() || a.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-500">Confirmada</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>;
      case 'completed': return <Badge variant="secondary">Completada</Badge>;
      default: return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Citas" subtitle={`${upcoming.length} citas próximas`} />
      
      <div className="space-y-4">
        <h3 className="font-semibold">Próximas Citas</h3>
        {upcoming.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No tienes citas programadas</CardContent></Card>
        ) : (
          upcoming.map(apt => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{apt.service_name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(apt.appointment_date), "EEEE d MMM", { locale: es })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{apt.appointment_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{apt.location_name}</span>
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-muted-foreground">Historial</h3>
          {past.slice(0, 5).map(apt => (
            <Card key={apt.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{apt.service_name}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(apt.appointment_date), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
