import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/ContentCard";

interface Treatment {
  id: string;
  name: string;
  status: string | null;
  start_date: string;
  end_date?: string | null;
  cost?: number | null;
  description?: string | null;
}

export const PatientTreatments = ({ treatments }: { treatments: Treatment[] }) => {
  const active = treatments.filter(t => t.status === 'in_progress');
  const completed = treatments.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Tratamientos" subtitle={`${active.length} activos, ${completed.length} completados`} />
      
      {active.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-green-500" />En Progreso</h3>
          {active.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{t.name}</h4>
                  <Badge className="bg-green-500">Activo</Badge>
                </div>
                {t.description && <p className="text-sm text-muted-foreground mb-2">{t.description}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Inicio: {format(new Date(t.start_date), "d MMM yyyy", { locale: es })}</span>
                  {t.cost && <span className="font-medium text-foreground">${t.cost.toLocaleString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-muted-foreground">Completados</h3>
          {completed.map(t => (
            <Card key={t.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{t.name}</h4>
                  <Badge variant="secondary">Completado</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {treatments.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No tienes tratamientos registrados</CardContent></Card>
      )}
    </div>
  );
};
