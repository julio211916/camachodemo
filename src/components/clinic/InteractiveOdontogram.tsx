import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface InteractiveOdontogramProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

type ToothCondition = 'healthy' | 'caries' | 'filled' | 'missing' | 'crown' | 'root_canal' | 'implant' | 'fracture';
type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual';
type MaterialType = 'amalgam' | 'composite' | 'ceramic' | 'metal' | 'zirconia' | 'gold';

interface ToothData {
  number: number;
  condition: ToothCondition;
  surfaces: Record<ToothSurface, { condition: ToothCondition; material?: MaterialType }>;
  notes?: string;
  treatments?: string[];
}

const conditions: { value: ToothCondition; label: string; color: string }[] = [
  { value: 'healthy', label: 'Sano', color: '#22c55e' },
  { value: 'caries', label: 'Caries', color: '#ef4444' },
  { value: 'filled', label: 'Obturado', color: '#3b82f6' },
  { value: 'missing', label: 'Ausente', color: '#6b7280' },
  { value: 'crown', label: 'Corona', color: '#eab308' },
  { value: 'root_canal', label: 'Endodoncia', color: '#a855f7' },
  { value: 'implant', label: 'Implante', color: '#06b6d4' },
  { value: 'fracture', label: 'Fractura', color: '#ec4899' }
];

const materials: { value: MaterialType; label: string; color: string }[] = [
  { value: 'amalgam', label: 'Amalgama', color: '#94a3b8' },
  { value: 'composite', label: 'Resina', color: '#fef3c7' },
  { value: 'ceramic', label: 'Cerámica', color: '#ffffff' },
  { value: 'metal', label: 'Metal', color: '#71717a' },
  { value: 'zirconia', label: 'Zirconio', color: '#f1f5f9' },
  { value: 'gold', label: 'Oro', color: '#fbbf24' }
];

const surfaces: { value: ToothSurface; label: string; shortLabel: string }[] = [
  { value: 'occlusal', label: 'Oclusal', shortLabel: 'O' },
  { value: 'mesial', label: 'Mesial', shortLabel: 'M' },
  { value: 'distal', label: 'Distal', shortLabel: 'D' },
  { value: 'buccal', label: 'Vestibular', shortLabel: 'V' },
  { value: 'lingual', label: 'Lingual', shortLabel: 'L' }
];

// Tooth positions
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const getToothType = (number: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
  const lastDigit = number % 10;
  if (lastDigit >= 6) return 'molar';
  if (lastDigit >= 4) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor';
};

export const InteractiveOdontogram = ({ patientId, patientName, readOnly = false }: InteractiveOdontogramProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('healthy');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('composite');
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'buccal' | 'palatal'>('buccal');
  const [toothData, setToothData] = useState<Record<number, ToothData>>({});

  // Fetch existing data
  const { isLoading } = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('odontogram')
        .select('*')
        .eq('patient_id', patientId);
      
      if (error) throw error;
      
      // Transform data
      const transformed: Record<number, ToothData> = {};
      data?.forEach((item: any) => {
        if (!transformed[item.tooth_number]) {
          transformed[item.tooth_number] = {
            number: item.tooth_number,
            condition: item.condition as ToothCondition,
            surfaces: {
              occlusal: { condition: 'healthy' },
              mesial: { condition: 'healthy' },
              distal: { condition: 'healthy' },
              buccal: { condition: 'healthy' },
              lingual: { condition: 'healthy' }
            },
            notes: item.notes
          };
        }
        if (item.surface) {
          const surfaceMap: Record<string, ToothSurface> = {
            'O': 'occlusal', 'M': 'mesial', 'D': 'distal', 'V': 'buccal', 'L': 'lingual'
          };
          const surface = surfaceMap[item.surface];
          if (surface) {
            transformed[item.tooth_number].surfaces[surface] = {
              condition: item.condition as ToothCondition,
              material: item.treatment_done as MaterialType
            };
          }
        }
      });
      setToothData(transformed);
      return transformed;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTooth) return;
      
      const { data: user } = await supabase.auth.getUser();
      const records = [];

      // Save main tooth condition
      records.push({
        patient_id: patientId,
        tooth_number: selectedTooth,
        condition: selectedCondition,
        notes,
        recorded_by: user.user?.id
      });

      // Save surface conditions
      const currentTooth = toothData[selectedTooth];
      if (currentTooth) {
        for (const [surface, data] of Object.entries(currentTooth.surfaces)) {
          if (data.condition !== 'healthy') {
            const surfaceMap: Record<string, string> = {
              'occlusal': 'O', 'mesial': 'M', 'distal': 'D', 'buccal': 'V', 'lingual': 'L'
            };
            records.push({
              patient_id: patientId,
              tooth_number: selectedTooth,
              surface: surfaceMap[surface],
              condition: data.condition,
              treatment_done: data.material,
              recorded_by: user.user?.id
            });
          }
        }
      }

      // Delete existing and insert new
      await supabase.from('odontogram').delete().eq('patient_id', patientId).eq('tooth_number', selectedTooth);
      
      for (const record of records) {
        await supabase.from('odontogram').insert(record);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram', patientId] });
      toast({ title: "Guardado", description: "Odontograma actualizado" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  });

  const handleToothClick = (number: number) => {
    if (readOnly) return;
    setSelectedTooth(number);
    const existing = toothData[number];
    if (existing) {
      setSelectedCondition(existing.condition);
      setNotes(existing.notes || '');
    } else {
      setSelectedCondition('healthy');
      setNotes('');
    }
    setSelectedSurface(null);
    setDialogOpen(true);
  };

  const updateSurfaceCondition = (surface: ToothSurface, condition: ToothCondition, material?: MaterialType) => {
    if (!selectedTooth) return;
    
    const defaultSurfaces: Record<ToothSurface, { condition: ToothCondition; material?: MaterialType }> = {
      occlusal: { condition: 'healthy' },
      mesial: { condition: 'healthy' },
      distal: { condition: 'healthy' },
      buccal: { condition: 'healthy' },
      lingual: { condition: 'healthy' }
    };
    
    setToothData(prev => {
      const existing = prev[selectedTooth];
      return {
        ...prev,
        [selectedTooth]: {
          number: selectedTooth,
          condition: existing?.condition || 'healthy',
          notes: existing?.notes,
          treatments: existing?.treatments,
          surfaces: {
            ...defaultSurfaces,
            ...(existing?.surfaces || {}),
            [surface]: { condition, material }
          }
        }
      };
    });
  };

  const getConditionColor = (condition: ToothCondition): string => {
    return conditions.find(c => c.value === condition)?.color || '#22c55e';
  };

  const defaultSurfaceData = {
    occlusal: { condition: 'healthy' as ToothCondition },
    mesial: { condition: 'healthy' as ToothCondition },
    distal: { condition: 'healthy' as ToothCondition },
    buccal: { condition: 'healthy' as ToothCondition },
    lingual: { condition: 'healthy' as ToothCondition }
  };

  // SVG Tooth Component with buccal view
  const ToothSVG = ({ number, isUpper }: { number: number; isUpper: boolean }) => {
    const tooth = toothData[number];
    const condition = tooth?.condition || 'healthy';
    const toothType = getToothType(number);
    const isMissing = condition === 'missing';

    // Get surface colors
    const surfaceColors = tooth?.surfaces || defaultSurfaceData;

    const renderMolarSVG = () => (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        {/* Root structure (visible in buccal view) */}
        <g className="roots">
          {/* Three roots for upper molars, two for lower */}
          {isUpper ? (
            <>
              <path d={`M25,60 Q20,90 22,115`} fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
              <path d={`M50,60 Q50,85 50,115`} fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
              <path d={`M75,60 Q80,90 78,115`} fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={`M30,60 Q25,85 28,115`} fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="10" strokeLinecap="round" />
              <path d={`M70,60 Q75,85 72,115`} fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="10" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Crown */}
        <g className="crown">
          <rect 
            x="10" y="5" width="80" height="55" rx="10"
            fill={isMissing ? 'transparent' : getConditionColor(condition)}
            stroke={isMissing ? '#ccc' : '#333'}
            strokeWidth="2"
            strokeDasharray={isMissing ? '5,5' : 'none'}
          />
          
          {/* Surface divisions */}
          {!isMissing && (
            <>
              {/* Occlusal center */}
              <rect 
                x="30" y="20" width="40" height="25" rx="5"
                fill={getConditionColor(surfaceColors.occlusal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
                onClick={(e) => { e.stopPropagation(); setSelectedSurface('occlusal'); }}
              />
              
              {/* Buccal (top) */}
              <path 
                d="M30,5 L70,5 L70,20 L30,20 Z"
                fill={getConditionColor(surfaceColors.buccal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Mesial (left) */}
              <path 
                d="M10,5 L30,5 L30,60 L10,60 Z"
                fill={getConditionColor(surfaceColors.mesial?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Distal (right) */}
              <path 
                d="M70,5 L90,5 L90,60 L70,60 Z"
                fill={getConditionColor(surfaceColors.distal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Lingual (bottom) */}
              <path 
                d="M30,45 L70,45 L70,60 L30,60 Z"
                fill={getConditionColor(surfaceColors.lingual?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
            </>
          )}

          {/* Condition indicators */}
          {condition === 'crown' && (
            <circle cx="50" cy="30" r="20" fill="none" stroke="#fff" strokeWidth="3" />
          )}
          {condition === 'root_canal' && (
            <>
              <line x1="35" y1="15" x2="65" y2="45" stroke="#fff" strokeWidth="3" />
              <line x1="65" y1="15" x2="35" y2="45" stroke="#fff" strokeWidth="3" />
            </>
          )}
          {condition === 'implant' && (
            <rect x="45" y="55" width="10" height="40" fill="#06b6d4" />
          )}
        </g>
      </svg>
    );

    const renderPremolarSVG = () => (
      <svg viewBox="0 0 80 110" className="w-full h-full">
        {/* Single or bifurcated root */}
        <path 
          d={isUpper ? "M40,55 Q35,80 38,105" : "M40,55 Q40,80 40,105"} 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="12" 
          strokeLinecap="round" 
        />
        
        {/* Crown */}
        <ellipse 
          cx="40" cy="30" rx="30" ry="28"
          fill={isMissing ? 'transparent' : getConditionColor(condition)}
          stroke={isMissing ? '#ccc' : '#333'}
          strokeWidth="2"
          strokeDasharray={isMissing ? '5,5' : 'none'}
        />
        
        {!isMissing && (
          <ellipse 
            cx="40" cy="30" rx="15" ry="12"
            fill={getConditionColor(surfaceColors.occlusal?.condition || 'healthy')}
            stroke="#fff"
            strokeWidth="1"
          />
        )}
      </svg>
    );

    const renderCanineSVG = () => (
      <svg viewBox="0 0 60 120" className="w-full h-full">
        {/* Long single root */}
        <path 
          d="M30,50 Q30,85 30,115" 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="14" 
          strokeLinecap="round" 
        />
        
        {/* Pointed crown */}
        <path 
          d="M10,50 L30,5 L50,50 Q50,55 30,55 Q10,55 10,50 Z"
          fill={isMissing ? 'transparent' : getConditionColor(condition)}
          stroke={isMissing ? '#ccc' : '#333'}
          strokeWidth="2"
          strokeDasharray={isMissing ? '5,5' : 'none'}
        />
      </svg>
    );

    const renderIncisorSVG = () => (
      <svg viewBox="0 0 50 100" className="w-full h-full">
        {/* Single root */}
        <path 
          d="M25,45 Q25,70 25,95" 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="10" 
          strokeLinecap="round" 
        />
        
        {/* Flat crown */}
        <rect 
          x="5" y="5" width="40" height="40" rx="5"
          fill={isMissing ? 'transparent' : getConditionColor(condition)}
          stroke={isMissing ? '#ccc' : '#333'}
          strokeWidth="2"
          strokeDasharray={isMissing ? '5,5' : 'none'}
        />
      </svg>
    );

    return (
      <motion.div
        className="cursor-pointer relative"
        style={{ 
          width: toothType === 'molar' ? 60 : toothType === 'premolar' ? 50 : 40,
          height: toothType === 'molar' ? 80 : 70,
          transform: `scale(${zoom})`
        }}
        whileHover={{ scale: zoom * 1.1 }}
        whileTap={{ scale: zoom * 0.95 }}
        onClick={() => handleToothClick(number)}
      >
        {toothType === 'molar' && renderMolarSVG()}
        {toothType === 'premolar' && renderPremolarSVG()}
        {toothType === 'canine' && renderCanineSVG()}
        {toothType === 'incisor' && renderIncisorSVG()}
        
        {/* Tooth number */}
        <div className={`absolute ${isUpper ? 'bottom-[-20px]' : 'top-[-20px]'} left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground`}>
          {number}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Odontograma Interactivo - Vista Bucal
          {patientName && <Badge variant="secondary">{patientName}</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buccal">Vestibular</SelectItem>
              <SelectItem value="palatal">Palatino</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {conditions.map((cond) => (
            <Badge 
              key={cond.value}
              variant="outline" 
              className="gap-1"
              style={{ borderColor: cond.color }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cond.color }} />
              {cond.label}
            </Badge>
          ))}
        </div>

        {/* Odontogram Display */}
        <div className="flex flex-col items-center gap-8 py-8 overflow-x-auto">
          {/* Upper Arch */}
          <div className="relative">
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Superior
            </div>
            <div className="flex items-end gap-1 p-4 bg-gradient-to-b from-secondary/30 to-transparent rounded-t-[100px]">
              {upperTeeth.map((num) => (
                <ToothSVG key={num} number={num} isUpper={true} />
              ))}
            </div>
          </div>

          {/* Midline */}
          <div className="w-full h-px bg-border relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">
              Línea Media
            </div>
          </div>

          {/* Lower Arch */}
          <div className="relative">
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Inferior
            </div>
            <div className="flex items-start gap-1 p-4 bg-gradient-to-t from-secondary/30 to-transparent rounded-b-[100px]">
              {lowerTeeth.map((num) => (
                <ToothSVG key={num} number={num} isUpper={false} />
              ))}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Diente {selectedTooth}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="condition">
              <TabsList className="w-full">
                <TabsTrigger value="condition" className="flex-1">Condición</TabsTrigger>
                <TabsTrigger value="surfaces" className="flex-1">Superficies</TabsTrigger>
                <TabsTrigger value="material" className="flex-1">Material</TabsTrigger>
              </TabsList>

              <TabsContent value="condition" className="space-y-4">
                <Label>Condición General</Label>
                <div className="grid grid-cols-4 gap-2">
                  {conditions.map((cond) => (
                    <Button
                      key={cond.value}
                      variant={selectedCondition === cond.value ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => setSelectedCondition(cond.value)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cond.color }} />
                      {cond.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="surfaces" className="space-y-4">
                <Label>Seleccionar Superficie</Label>
                <div className="flex gap-2 mb-4">
                  {surfaces.map((surface) => (
                    <Button
                      key={surface.value}
                      variant={selectedSurface === surface.value ? 'default' : 'outline'}
                      onClick={() => setSelectedSurface(surface.value)}
                    >
                      {surface.shortLabel} - {surface.label}
                    </Button>
                  ))}
                </div>
                
                {selectedSurface && (
                  <div className="grid grid-cols-4 gap-2">
                    {conditions.map((cond) => (
                      <Button
                        key={cond.value}
                        variant="outline"
                        className="gap-2"
                        onClick={() => updateSurfaceCondition(selectedSurface, cond.value, selectedMaterial)}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cond.color }} />
                        {cond.label}
                      </Button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="material" className="space-y-4">
                <Label>Material de Restauración</Label>
                <div className="grid grid-cols-3 gap-2">
                  {materials.map((mat) => (
                    <Button
                      key={mat.value}
                      variant={selectedMaterial === mat.value ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => setSelectedMaterial(mat.value)}
                    >
                      <div 
                        className="w-4 h-4 rounded border" 
                        style={{ backgroundColor: mat.color }} 
                      />
                      {mat.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 mt-4">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
