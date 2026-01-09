import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";

interface OdontogramProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

const conditions = [
  { value: "sano", label: "Sano", color: "bg-green-500" },
  { value: "caries", label: "Caries", color: "bg-red-500" },
  { value: "obturado", label: "Obturado", color: "bg-blue-500" },
  { value: "ausente", label: "Ausente", color: "bg-gray-500" },
  { value: "corona", label: "Corona", color: "bg-yellow-500" },
  { value: "endodoncia", label: "Endodoncia", color: "bg-purple-500" },
  { value: "implante", label: "Implante", color: "bg-cyan-500" },
  { value: "protesis", label: "Prótesis", color: "bg-orange-500" },
  { value: "fractura", label: "Fractura", color: "bg-pink-500" },
  { value: "movilidad", label: "Movilidad", color: "bg-amber-600" },
];

const surfaces = ["V", "L", "M", "D", "O"];

// Adult teeth (FDI notation)
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Primary teeth
const upperPrimaryTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerPrimaryTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

interface ToothData {
  tooth_number: number;
  surface?: string;
  condition: string;
  notes?: string;
}

export const Odontogram = ({ patientId, patientName, readOnly = false }: OdontogramProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showPrimary, setShowPrimary] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: toothData, isLoading } = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('odontogram')
        .select('*')
        .eq('patient_id', patientId);
      if (error) throw error;
      return data as ToothData[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<ToothData, 'id'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('odontogram')
        .upsert({
          patient_id: patientId,
          tooth_number: data.tooth_number,
          surface: data.surface || null,
          condition: data.condition,
          notes: data.notes,
          recorded_by: user.user?.id,
        }, {
          onConflict: 'patient_id,tooth_number,surface'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram', patientId] });
      toast({ title: "Guardado", description: "Odontograma actualizado" });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedTooth(null);
    setSelectedSurface("");
    setSelectedCondition("");
    setNotes("");
  };

  const getToothCondition = (toothNumber: number): string => {
    const tooth = toothData?.find(t => t.tooth_number === toothNumber && !t.surface);
    return tooth?.condition || "sano";
  };

  const getConditionColor = (condition: string): string => {
    return conditions.find(c => c.value === condition)?.color || "bg-gray-200";
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly) return;
    setSelectedTooth(toothNumber);
    const existing = toothData?.find(t => t.tooth_number === toothNumber && !t.surface);
    if (existing) {
      setSelectedCondition(existing.condition);
      setNotes(existing.notes || "");
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTooth || !selectedCondition) return;
    saveMutation.mutate({
      tooth_number: selectedTooth,
      surface: selectedSurface || undefined,
      condition: selectedCondition,
      notes: notes || undefined,
    });
  };

  const ToothComponent = ({ number }: { number: number }) => {
    const condition = getToothCondition(number);
    const colorClass = getConditionColor(condition);
    
    return (
      <button
        onClick={() => handleToothClick(number)}
        className={`w-10 h-12 ${colorClass} rounded-md flex flex-col items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity border-2 border-white shadow-sm`}
        disabled={readOnly}
      >
        <span>{number}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentUpperTeeth = showPrimary ? upperPrimaryTeeth : upperTeeth;
  const currentLowerTeeth = showPrimary ? lowerPrimaryTeeth : lowerTeeth;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          🦷 Odontograma {patientName && `- ${patientName}`}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrimary(!showPrimary)}
        >
          {showPrimary ? "Ver Permanentes" : "Ver Temporales"}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {conditions.map(c => (
            <Badge key={c.value} className={`${c.color} text-white`}>
              {c.label}
            </Badge>
          ))}
        </div>

        {/* Upper Arch */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">Arcada Superior</p>
          <div className="flex justify-center gap-1">
            {currentUpperTeeth.map(tooth => (
              <ToothComponent key={tooth} number={tooth} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-muted my-4" />

        {/* Lower Arch */}
        <div>
          <div className="flex justify-center gap-1">
            {currentLowerTeeth.map(tooth => (
              <ToothComponent key={tooth} number={tooth} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">Arcada Inferior</p>
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Diente #{selectedTooth}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Condición</label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar condición" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${c.color}`} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Superficie (opcional)</label>
                <Select value={selectedSurface} onValueChange={setSelectedSurface}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toda la pieza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toda la pieza</SelectItem>
                    {surfaces.map(s => (
                      <SelectItem key={s} value={s}>{s} - {
                        s === "V" ? "Vestibular" :
                        s === "L" ? "Lingual/Palatino" :
                        s === "M" ? "Mesial" :
                        s === "D" ? "Distal" : "Oclusal/Incisal"
                      }</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!selectedCondition || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
