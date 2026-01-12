import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrthodonticsModuleProps {
  patientId?: string;
  patientName?: string;
}

interface OrthoCase {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  case_type: string;
  start_date: string;
  estimated_end_date: string | null;
  actual_end_date: string | null;
  bracket_type: string | null;
  initial_diagnosis: string | null;
  treatment_objectives: string | null;
  current_phase: string;
  total_visits: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface OrthoVisit {
  id: string;
  case_id: string;
  visit_date: string;
  procedure_done: string | null;
  wire_used: string | null;
  next_appointment_notes: string | null;
  notes: string | null;
  created_at: string;
}

const caseTypes = [
  "Brackets Metálicos",
  "Brackets Estéticos",
  "Brackets Autoligados",
  "Alineadores Invisibles",
  "Ortodoncia Lingual",
  "Ortopedia Maxilar",
];

const phases = [
  { value: "inicial", label: "Fase Inicial", color: "bg-blue-500" },
  { value: "alineamiento", label: "Alineamiento", color: "bg-cyan-500" },
  { value: "correccion", label: "Corrección", color: "bg-yellow-500" },
  { value: "acabado", label: "Acabado", color: "bg-orange-500" },
  { value: "retencion", label: "Retención", color: "bg-green-500" },
];

export const OrthodonticsModule = ({ patientId, patientName }: OrthodonticsModuleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewCase, setShowNewCase] = useState(false);
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [selectedCase, setSelectedCase] = useState<OrthoCase | null>(null);
  
  const [caseForm, setCaseForm] = useState({
    case_type: "",
    bracket_type: "",
    initial_diagnosis: "",
    treatment_objectives: "",
    estimated_end_date: "",
    notes: "",
  });

  const [visitForm, setVisitForm] = useState({
    procedure_done: "",
    wire_used: "",
    next_appointment_notes: "",
    notes: "",
  });

  const { data: cases, isLoading } = useQuery({
    queryKey: ['orthodontics-cases', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orthodontics_cases')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrthoCase[];
    },
  });

  const { data: visits } = useQuery({
    queryKey: ['orthodontics-visits', selectedCase?.id],
    queryFn: async () => {
      if (!selectedCase) return [];
      const { data, error } = await supabase
        .from('orthodontics_visits')
        .select('*')
        .eq('case_id', selectedCase.id)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return data as OrthoVisit[];
    },
    enabled: !!selectedCase,
  });

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('orthodontics_cases')
        .insert({
          patient_id: patientId,
          doctor_id: user.user?.id,
          case_type: caseForm.case_type,
          bracket_type: caseForm.bracket_type || null,
          initial_diagnosis: caseForm.initial_diagnosis || null,
          treatment_objectives: caseForm.treatment_objectives || null,
          estimated_end_date: caseForm.estimated_end_date || null,
          notes: caseForm.notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontics-cases', patientId] });
      toast({ title: "Caso creado", description: "Caso de ortodoncia registrado" });
      setShowNewCase(false);
      setCaseForm({
        case_type: "",
        bracket_type: "",
        initial_diagnosis: "",
        treatment_objectives: "",
        estimated_end_date: "",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el caso", variant: "destructive" });
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase) return;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('orthodontics_visits')
        .insert({
          case_id: selectedCase.id,
          procedure_done: visitForm.procedure_done || null,
          wire_used: visitForm.wire_used || null,
          next_appointment_notes: visitForm.next_appointment_notes || null,
          notes: visitForm.notes || null,
          created_by: user.user?.id,
        });
      if (error) throw error;

      // Update total visits count
      await supabase
        .from('orthodontics_cases')
        .update({ total_visits: (selectedCase.total_visits || 0) + 1 })
        .eq('id', selectedCase.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontics-visits', selectedCase?.id] });
      queryClient.invalidateQueries({ queryKey: ['orthodontics-cases', patientId] });
      toast({ title: "Visita registrada", description: "Control de ortodoncia guardado" });
      setShowNewVisit(false);
      setVisitForm({
        procedure_done: "",
        wire_used: "",
        next_appointment_notes: "",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar la visita", variant: "destructive" });
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ caseId, phase }: { caseId: string; phase: string }) => {
      const { error } = await supabase
        .from('orthodontics_cases')
        .update({ current_phase: phase })
        .eq('id', caseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontics-cases', patientId] });
      toast({ title: "Fase actualizada" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completado</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspendido</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          🦷 Ortodoncia {patientName && `- ${patientName}`}
        </CardTitle>
        <Button onClick={() => setShowNewCase(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Caso
        </Button>
      </CardHeader>
      <CardContent>
        {cases?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay casos de ortodoncia registrados</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowNewCase(true)}>
              Crear primer caso
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cases?.map(orthoCase => (
              <Card key={orthoCase.id} className={`cursor-pointer hover:border-primary transition-colors ${selectedCase?.id === orthoCase.id ? 'border-primary' : ''}`}>
                <CardContent className="pt-4" onClick={() => setSelectedCase(orthoCase)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{orthoCase.case_type}</h4>
                        {getStatusBadge(orthoCase.status)}
                      </div>
                      {orthoCase.bracket_type && (
                        <p className="text-sm text-muted-foreground">{orthoCase.bracket_type}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Inicio: {format(new Date(orthoCase.start_date), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {orthoCase.total_visits} visitas
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Fase Actual</p>
                      <Select
                        value={orthoCase.current_phase}
                        onValueChange={(value) => updatePhaseMutation.mutate({ caseId: orthoCase.id, phase: value })}
                      >
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {phases.map(phase => (
                            <SelectItem key={phase.value} value={phase.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${phase.color}`} />
                                {phase.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Case Details */}
        {selectedCase && (
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Historial de Visitas</h4>
              <Button onClick={() => setShowNewVisit(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Visita
              </Button>
            </div>

            {selectedCase.initial_diagnosis && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Diagnóstico Inicial:</p>
                <p className="text-sm text-muted-foreground">{selectedCase.initial_diagnosis}</p>
              </div>
            )}

            <div className="space-y-3">
              {visits?.map((visit, index) => (
                <div key={visit.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {(visits?.length || 0) - index}
                    </div>
                    {index < (visits?.length || 0) - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {format(new Date(visit.visit_date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                    {visit.procedure_done && (
                      <p className="text-sm"><strong>Procedimiento:</strong> {visit.procedure_done}</p>
                    )}
                    {visit.wire_used && (
                      <p className="text-sm"><strong>Arco:</strong> {visit.wire_used}</p>
                    )}
                    {visit.next_appointment_notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Próxima cita:</strong> {visit.next_appointment_notes}
                      </p>
                    )}
                    {visit.notes && (
                      <p className="text-sm text-muted-foreground">{visit.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!visits || visits.length === 0) && (
                <p className="text-center text-muted-foreground py-4">No hay visitas registradas</p>
              )}
            </div>
          </div>
        )}

        {/* New Case Dialog */}
        <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Caso de Ortodoncia</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Tratamiento *</label>
                <Select value={caseForm.case_type} onValueChange={(v) => setCaseForm(prev => ({ ...prev, case_type: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map(ct => (
                      <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Bracket</label>
                <Input
                  value={caseForm.bracket_type}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, bracket_type: e.target.value }))}
                  placeholder="Ej: MBT .022"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Estimada de Fin</label>
                <Input
                  type="date"
                  value={caseForm.estimated_end_date}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, estimated_end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Diagnóstico Inicial</label>
                <Textarea
                  value={caseForm.initial_diagnosis}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, initial_diagnosis: e.target.value }))}
                  placeholder="Descripción del caso..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Objetivos del Tratamiento</label>
                <Textarea
                  value={caseForm.treatment_objectives}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, treatment_objectives: e.target.value }))}
                  placeholder="Metas a lograr..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCase(false)}>Cancelar</Button>
              <Button onClick={() => createCaseMutation.mutate()} disabled={!caseForm.case_type || createCaseMutation.isPending}>
                {createCaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Crear Caso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Visit Dialog */}
        <Dialog open={showNewVisit} onOpenChange={setShowNewVisit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Visita de Control</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Procedimiento Realizado</label>
                <Input
                  value={visitForm.procedure_done}
                  onChange={(e) => setVisitForm(prev => ({ ...prev, procedure_done: e.target.value }))}
                  placeholder="Ej: Cambio de arco, activación..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Arco Utilizado</label>
                <Input
                  value={visitForm.wire_used}
                  onChange={(e) => setVisitForm(prev => ({ ...prev, wire_used: e.target.value }))}
                  placeholder="Ej: NiTi .014, SS .016x.022"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Indicaciones para Próxima Cita</label>
                <Textarea
                  value={visitForm.next_appointment_notes}
                  onChange={(e) => setVisitForm(prev => ({ ...prev, next_appointment_notes: e.target.value }))}
                  placeholder="Qué se hará en la próxima visita..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas Adicionales</label>
                <Textarea
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewVisit(false)}>Cancelar</Button>
              <Button onClick={() => createVisitMutation.mutate()} disabled={createVisitMutation.isPending}>
                {createVisitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Registrar Visita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
