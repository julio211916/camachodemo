import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Save, ZoomIn, ZoomOut, RotateCcw, Info, Settings, 
  Loader2, Check, X, MoreVertical, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientOdontogramSectionProps {
  patientId: string;
  patientName: string;
}

type NotationSystem = 'fdi' | 'universal' | 'palmer';
type ToothCondition = 'healthy' | 'caries' | 'filled' | 'crown' | 'implant' | 'missing' | 'extraction' | 'root_canal' | 'fracture' | 'not_erupted';
type ToothSurface = 'O' | 'M' | 'D' | 'V' | 'L' | 'P';
type MaterialType = 'amalgam' | 'composite' | 'ceramic' | 'gold' | 'temporary' | 'none';

interface ToothData {
  condition: ToothCondition;
  surfaces: { [key in ToothSurface]?: { condition: ToothCondition; material: MaterialType } };
  notes: string;
  treatment_done?: string;
}

const conditions: { value: ToothCondition; label: string; color: string }[] = [
  { value: 'healthy', label: 'Sano', color: '#22c55e' },
  { value: 'caries', label: 'Caries', color: '#ef4444' },
  { value: 'filled', label: 'Obturado', color: '#3b82f6' },
  { value: 'crown', label: 'Corona', color: '#eab308' },
  { value: 'implant', label: 'Implante', color: '#8b5cf6' },
  { value: 'missing', label: 'Ausente', color: '#6b7280' },
  { value: 'extraction', label: 'Extracción indicada', color: '#dc2626' },
  { value: 'root_canal', label: 'Endodoncia', color: '#f97316' },
  { value: 'fracture', label: 'Fractura', color: '#be185d' },
  { value: 'not_erupted', label: 'Sin erupcionar', color: '#94a3b8' }
];

const materials: { value: MaterialType; label: string }[] = [
  { value: 'none', label: 'Sin material' },
  { value: 'amalgam', label: 'Amalgama' },
  { value: 'composite', label: 'Resina' },
  { value: 'ceramic', label: 'Cerámica' },
  { value: 'gold', label: 'Oro' },
  { value: 'temporary', label: 'Temporal' }
];

const surfaces: { value: ToothSurface; label: string }[] = [
  { value: 'O', label: 'Oclusal' },
  { value: 'M', label: 'Mesial' },
  { value: 'D', label: 'Distal' },
  { value: 'V', label: 'Vestibular' },
  { value: 'L', label: 'Lingual' },
  { value: 'P', label: 'Palatino' }
];

// FDI notation for adult teeth
const upperTeethAdult = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeethAdult = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation for primary teeth
const upperTeethPrimary = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerTeethPrimary = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Universal notation mapping
const fdiToUniversal: { [key: number]: string } = {
  18: '1', 17: '2', 16: '3', 15: '4', 14: '5', 13: '6', 12: '7', 11: '8',
  21: '9', 22: '10', 23: '11', 24: '12', 25: '13', 26: '14', 27: '15', 28: '16',
  38: '17', 37: '18', 36: '19', 35: '20', 34: '21', 33: '22', 32: '23', 31: '24',
  41: '25', 42: '26', 43: '27', 44: '28', 45: '29', 46: '30', 47: '31', 48: '32',
  55: 'A', 54: 'B', 53: 'C', 52: 'D', 51: 'E', 61: 'F', 62: 'G', 63: 'H', 64: 'I', 65: 'J',
  75: 'K', 74: 'L', 73: 'M', 72: 'N', 71: 'O', 81: 'P', 82: 'Q', 83: 'R', 84: 'S', 85: 'T'
};

export const PatientOdontogramSection = ({ patientId, patientName }: PatientOdontogramSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isPrimary, setIsPrimary] = useState(false);
  const [notation, setNotation] = useState<NotationSystem>('fdi');
  const [zoom, setZoom] = useState(1);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toothData, setToothData] = useState<{ [key: number]: ToothData }>({});
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('healthy');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('none');
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>([]);
  const [notes, setNotes] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [showDiagnosisOnly, setShowDiagnosisOnly] = useState(false);

  const upperTeeth = isPrimary ? upperTeethPrimary : upperTeethAdult;
  const lowerTeeth = isPrimary ? lowerTeethPrimary : lowerTeethAdult;

  // Fetch existing odontogram data
  const { data: odontogramData = [], isLoading } = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('odontogram')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Transform fetched data to tooth data structure
  useEffect(() => {
    const newToothData: { [key: number]: ToothData } = {};
    odontogramData.forEach((record: any) => {
      if (!newToothData[record.tooth_number]) {
        newToothData[record.tooth_number] = {
          condition: record.condition as ToothCondition,
          surfaces: {},
          notes: record.notes || '',
          treatment_done: record.treatment_done
        };
      }
      if (record.surface) {
        newToothData[record.tooth_number].surfaces[record.surface as ToothSurface] = {
          condition: record.condition as ToothCondition,
          material: 'none'
        };
      }
    });
    setToothData(newToothData);
  }, [odontogramData]);

  // Save odontogram mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing records for this patient
      await supabase.from('odontogram').delete().eq('patient_id', patientId);

      // Create new records
      const records: any[] = [];
      Object.entries(toothData).forEach(([toothNum, data]) => {
        const toothNumber = parseInt(toothNum);
        
        // Main tooth record
        records.push({
          patient_id: patientId,
          tooth_number: toothNumber,
          condition: data.condition,
          notes: data.notes,
          treatment_done: data.treatment_done
        });

        // Surface records
        Object.entries(data.surfaces).forEach(([surface, surfaceData]) => {
          records.push({
            patient_id: patientId,
            tooth_number: toothNumber,
            surface,
            condition: surfaceData.condition,
            treatment_done: data.treatment_done
          });
        });
      });

      if (records.length > 0) {
        const { error } = await supabase.from('odontogram').insert(records);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram', patientId] });
      toast({ title: "Odontograma guardado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const getToothLabel = (fdiNumber: number): string => {
    if (notation === 'universal') {
      return fdiToUniversal[fdiNumber] || fdiNumber.toString();
    }
    return fdiNumber.toString();
  };

  const getToothType = (num: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
    const lastDigit = num % 10;
    if (lastDigit >= 6 && lastDigit <= 8) return 'molar';
    if (lastDigit >= 4 && lastDigit <= 5) return 'premolar';
    if (lastDigit === 3) return 'canine';
    return 'incisor';
  };

  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    if (multiSelect) {
      setSelectedTeeth(prev => 
        prev.includes(toothNumber) 
          ? prev.filter(t => t !== toothNumber)
          : [...prev, toothNumber]
      );
    } else {
      setSelectedTooth(toothNumber);
      const existing = toothData[toothNumber];
      if (existing) {
        setSelectedCondition(existing.condition);
        setNotes(existing.notes);
        setSelectedSurfaces(Object.keys(existing.surfaces) as ToothSurface[]);
      } else {
        setSelectedCondition('healthy');
        setNotes('');
        setSelectedSurfaces([]);
      }
      setDialogOpen(true);
    }
  };

  const saveToothData = () => {
    if (!selectedTooth) return;

    const newData: ToothData = {
      condition: selectedCondition,
      surfaces: {},
      notes
    };

    selectedSurfaces.forEach(surface => {
      newData.surfaces[surface] = {
        condition: selectedCondition,
        material: selectedMaterial
      };
    });

    setToothData(prev => ({
      ...prev,
      [selectedTooth]: newData
    }));

    setDialogOpen(false);
    setSelectedTooth(null);
  };

  const getConditionColor = (condition: ToothCondition): string => {
    return conditions.find(c => c.value === condition)?.color || '#6b7280';
  };

  // Tooth SVG component
  const ToothSVG = ({ toothNumber, size = 50 }: { toothNumber: number; size?: number }) => {
    const data = toothData[toothNumber];
    const type = getToothType(toothNumber);
    const isSelected = selectedTeeth.includes(toothNumber) || selectedTooth === toothNumber;
    const baseColor = data ? getConditionColor(data.condition) : '#e5e7eb';

    return (
      <div 
        className={cn(
          "relative cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
        onClick={(e) => handleToothClick(toothNumber, e)}
        style={{ width: size, height: size * 1.5 }}
      >
        <svg viewBox="0 0 50 75" width={size} height={size * 1.5}>
          {/* Root(s) */}
          <g opacity="0.6">
            {type === 'molar' && (
              <>
                <path d="M12 40 L8 70 L16 70 L14 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
                <path d="M36 40 L34 70 L42 70 L38 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
                <path d="M22 40 L21 65 L29 65 L28 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
              </>
            )}
            {type === 'premolar' && (
              <>
                <path d="M15 40 L12 68 L20 68 L18 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
                <path d="M32 40 L30 68 L38 68 L35 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
              </>
            )}
            {(type === 'canine' || type === 'incisor') && (
              <path d="M20 40 L18 70 L32 70 L30 40" fill={baseColor} stroke="#333" strokeWidth="0.5" />
            )}
          </g>

          {/* Crown */}
          <rect 
            x="5" y="5" 
            width="40" height="35" 
            rx="5"
            fill={baseColor}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Surface divisions */}
          {/* Occlusal */}
          <rect 
            x="15" y="15" 
            width="20" height="15" 
            rx="2"
            fill={data?.surfaces['O'] ? getConditionColor(data.surfaces['O'].condition) : baseColor}
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Mesial */}
          <rect 
            x="5" y="15" 
            width="10" height="15" 
            fill={data?.surfaces['M'] ? getConditionColor(data.surfaces['M'].condition) : baseColor}
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Distal */}
          <rect 
            x="35" y="15" 
            width="10" height="15" 
            fill={data?.surfaces['D'] ? getConditionColor(data.surfaces['D'].condition) : baseColor}
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Vestibular */}
          <rect 
            x="15" y="5" 
            width="20" height="10" 
            fill={data?.surfaces['V'] ? getConditionColor(data.surfaces['V'].condition) : baseColor}
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Lingual/Palatino */}
          <rect 
            x="15" y="30" 
            width="20" height="10" 
            fill={data?.surfaces['L'] ? getConditionColor(data.surfaces['L'].condition) : baseColor}
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Special indicators */}
          {data?.condition === 'missing' && (
            <g>
              <line x1="5" y1="5" x2="45" y2="40" stroke="#333" strokeWidth="2" />
              <line x1="45" y1="5" x2="5" y2="40" stroke="#333" strokeWidth="2" />
            </g>
          )}
          {data?.condition === 'implant' && (
            <circle cx="25" cy="22" r="8" fill="none" stroke="#8b5cf6" strokeWidth="2" />
          )}
          {data?.condition === 'crown' && (
            <circle cx="25" cy="22" r="12" fill="none" stroke="#eab308" strokeWidth="2" />
          )}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-medium">
          {getToothLabel(toothNumber)}
        </div>
      </div>
    );
  };

  // History table data
  const historyRecords = odontogramData.slice(0, 20).map((record: any) => ({
    date: format(new Date(record.recorded_at), 'dd/MM/yyyy', { locale: es }),
    tooth: record.tooth_number,
    surfaces: record.surface || '-',
    condition: conditions.find(c => c.value === record.condition)?.label || record.condition,
    creator: 'Sistema'
  }));

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              Odontograma Interactivo
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={isPrimary ? "ghost" : "secondary"}
                  size="sm"
                  onClick={() => setIsPrimary(false)}
                >
                  Permanente
                </Button>
                <Button
                  variant={isPrimary ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsPrimary(true)}
                >
                  Temporal
                </Button>
              </div>

              <Select value={notation} onValueChange={(v: NotationSystem) => setNotation(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fdi">FDI</SelectItem>
                  <SelectItem value="universal">Universal</SelectItem>
                  <SelectItem value="palmer">Palmer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={multiSelect ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setMultiSelect(!multiSelect);
                  setSelectedTeeth([]);
                }}
              >
                Multi-piezas
              </Button>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="diagnosis-only"
                  checked={showDiagnosisOnly}
                  onCheckedChange={setShowDiagnosisOnly}
                />
                <Label htmlFor="diagnosis-only" className="text-sm">Solo diagnóstico</Label>
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Guardar</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
            {conditions.map(c => (
              <div key={c.value} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: c.color }} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Odontogram */}
          <div 
            className="flex flex-col items-center gap-8 py-6 overflow-x-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {/* Upper Arch */}
            <div className="text-center">
              <p className="text-sm font-medium mb-4 text-muted-foreground">Arcada Superior</p>
              <div className="flex gap-1 justify-center">
                {upperTeeth.map(tooth => (
                  <ToothSVG key={tooth} toothNumber={tooth} size={45} />
                ))}
              </div>
            </div>

            {/* Midline */}
            <div className="w-full max-w-3xl border-t-2 border-dashed border-muted-foreground/30" />

            {/* Lower Arch */}
            <div className="text-center">
              <p className="text-sm font-medium mb-4 text-muted-foreground">Arcada Inferior</p>
              <div className="flex gap-1 justify-center">
                {lowerTeeth.map(tooth => (
                  <ToothSVG key={tooth} toothNumber={tooth} size={45} />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(toothData).filter(d => d.condition === 'healthy').length}
                </p>
                <p className="text-sm text-muted-foreground">Sanos</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(toothData).filter(d => d.condition === 'caries').length}
                </p>
                <p className="text-sm text-muted-foreground">Caries</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(toothData).filter(d => d.condition === 'filled').length}
                </p>
                <p className="text-sm text-muted-foreground">Tratados</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-500/10 border-gray-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {Object.values(toothData).filter(d => d.condition === 'missing').length}
                </p>
                <p className="text-sm text-muted-foreground">Ausentes</p>
              </CardContent>
            </Card>
          </div>

          {/* History Table */}
          {historyRecords.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Historial de Cambios</h4>
              <ScrollArea className="h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Pieza</TableHead>
                      <TableHead>Caras</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map((record: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.tooth}</TableCell>
                        <TableCell>{record.surfaces}</TableCell>
                        <TableCell>{record.condition}</TableCell>
                        <TableCell>{record.creator}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tooth Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Pieza {selectedTooth ? getToothLabel(selectedTooth) : ''} - {getToothType(selectedTooth || 0)}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="condition" className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="condition">Condición</TabsTrigger>
              <TabsTrigger value="surfaces">Superficies</TabsTrigger>
              <TabsTrigger value="material">Material</TabsTrigger>
            </TabsList>

            <TabsContent value="condition" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {conditions.map(c => (
                  <Button
                    key={c.value}
                    variant={selectedCondition === c.value ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setSelectedCondition(c.value)}
                  >
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: c.color }} />
                    {c.label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="surfaces" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {surfaces.map(s => (
                  <Button
                    key={s.value}
                    variant={selectedSurfaces.includes(s.value) ? "default" : "outline"}
                    onClick={() => {
                      setSelectedSurfaces(prev =>
                        prev.includes(s.value)
                          ? prev.filter(x => x !== s.value)
                          : [...prev, s.value]
                      );
                    }}
                  >
                    {s.value} - {s.label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="material" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {materials.map(m => (
                  <Button
                    key={m.value}
                    variant={selectedMaterial === m.value ? "default" : "outline"}
                    onClick={() => setSelectedMaterial(m.value)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de la pieza..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveToothData}>
              <Check className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
