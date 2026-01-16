import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Activity, Calendar, User, DollarSign, 
  MoreVertical, Edit, Trash2, Eye, FileText, Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Treatment {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  cost: number;
  paidAmount: number;
  doctorName?: string;
}

interface PatientTreatmentPlansTabProps {
  patientId: string;
  treatments: Treatment[];
}

export const PatientTreatmentPlansTab = ({ patientId, treatments }: PatientTreatmentPlansTabProps) => {
  const { toast } = useToast();
  const [showNewTreatment, setShowNewTreatment] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'in_progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
      'pending': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20',
      'planned': 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    };
    const labels: Record<string, string> = {
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'planned': 'Planificado'
    };
    return (
      <Badge variant="outline" className={styles[status] || ''}>
        {labels[status] || status}
      </Badge>
    );
  };

  const activeTreatments = treatments.filter(t => t.status === 'in_progress');
  const completedTreatments = treatments.filter(t => t.status === 'completed');
  const plannedTreatments = treatments.filter(t => ['pending', 'planned'].includes(t.status));

  const totalCost = treatments.reduce((acc, t) => acc + (t.cost || 0), 0);
  const totalPaid = treatments.reduce((acc, t) => acc + (t.paidAmount || 0), 0);
  const progressPercent = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{activeTreatments.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">{completedTreatments.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Facturado</p>
                <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                <Progress value={progressPercent} className="h-1.5 mt-2" />
              </div>
              <span className="text-lg font-semibold text-primary">{progressPercent.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Planes de Tratamiento</h3>
        <Button onClick={() => setShowNewTreatment(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Treatment Plans List */}
      {treatments.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin planes de tratamiento</h3>
          <p className="text-muted-foreground mb-4">
            Crea un nuevo plan de tratamiento para este paciente
          </p>
          <Button onClick={() => setShowNewTreatment(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Plan
          </Button>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.map((treatment) => (
                <TableRow key={treatment.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{treatment.name}</p>
                      {treatment.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {treatment.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{treatment.doctorName || 'Sin asignar'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(treatment.startDate).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${treatment.cost?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span>${treatment.paidAmount?.toLocaleString() || 0}</span>
                      <Progress 
                        value={treatment.cost > 0 ? (treatment.paidAmount / treatment.cost) * 100 : 0} 
                        className="h-1.5 w-20" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(treatment.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTreatment(treatment)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Generar presupuesto
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Treatment Dialog */}
      <Dialog open={showNewTreatment} onOpenChange={setShowNewTreatment}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Plan de Tratamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre del Tratamiento</Label>
              <Input placeholder="Ej: Ortodoncia completa" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción del tratamiento..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Costo Total</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <Label>Fecha de Inicio</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label>Doctor Asignado</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTreatment(false)}>
              Cancelar
            </Button>
            <Button>Crear Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
