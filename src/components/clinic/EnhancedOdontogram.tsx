import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, Save, RotateCcw, ZoomIn, ZoomOut, Printer, Download,
  History, Calendar, User, FileText, Pencil, Trash2, Plus, Check, X,
  Baby, UserRound, Undo2, Redo2
} from "lucide-react";

interface EnhancedOdontogramProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

type ToothCondition = 
  | 'healthy' | 'caries' | 'filled' | 'missing' | 'crown' 
  | 'root_canal' | 'implant' | 'fracture' | 'abscess' 
  | 'extraction_indicated' | 'mobility' | 'bridge' | 'veneer';

type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual' | 'incisal';
type MaterialType = 'amalgam' | 'composite' | 'ceramic' | 'metal' | 'zirconia' | 'gold' | 'glass_ionomer' | 'temporary';

interface ToothData {
  number: number;
  condition: ToothCondition;
  surfaces: Record<ToothSurface, { condition: ToothCondition; material?: MaterialType }>;
  notes?: string;
  treatments?: TreatmentRecord[];
  lastUpdated?: string;
}

interface TreatmentRecord {
  id: string;
  date: string;
  condition: ToothCondition;
  surface?: ToothSurface;
  material?: MaterialType;
  notes?: string;
  doctor?: string;
}

// Enhanced conditions with more options
const conditions: { value: ToothCondition; label: string; labelEs: string; color: string; icon?: string }[] = [
  { value: 'healthy', label: 'Healthy', labelEs: 'Sano', color: '#22c55e' },
  { value: 'caries', label: 'Caries', labelEs: 'Caries', color: '#ef4444', icon: '●' },
  { value: 'filled', label: 'Filled', labelEs: 'Obturado', color: '#3b82f6', icon: '■' },
  { value: 'missing', label: 'Missing', labelEs: 'Ausente', color: '#6b7280', icon: '✕' },
  { value: 'crown', label: 'Crown', labelEs: 'Corona', color: '#eab308', icon: '○' },
  { value: 'root_canal', label: 'Root Canal', labelEs: 'Endodoncia', color: '#a855f7', icon: '╳' },
  { value: 'implant', label: 'Implant', labelEs: 'Implante', color: '#06b6d4', icon: '▼' },
  { value: 'fracture', label: 'Fracture', labelEs: 'Fractura', color: '#ec4899', icon: '⚡' },
  { value: 'abscess', label: 'Abscess', labelEs: 'Absceso', color: '#dc2626', icon: '◉' },
  { value: 'extraction_indicated', label: 'Extract', labelEs: 'Exodoncia', color: '#f97316', icon: '↓' },
  { value: 'mobility', label: 'Mobility', labelEs: 'Movilidad', color: '#fbbf24', icon: '↔' },
  { value: 'bridge', label: 'Bridge', labelEs: 'Puente', color: '#8b5cf6', icon: '═' },
  { value: 'veneer', label: 'Veneer', labelEs: 'Carilla', color: '#f0abfc', icon: '▭' }
];

const materials: { value: MaterialType; label: string; labelEs: string; color: string }[] = [
  { value: 'amalgam', label: 'Amalgam', labelEs: 'Amalgama', color: '#94a3b8' },
  { value: 'composite', label: 'Composite', labelEs: 'Resina', color: '#fef3c7' },
  { value: 'ceramic', label: 'Ceramic', labelEs: 'Cerámica', color: '#ffffff' },
  { value: 'metal', label: 'Metal', labelEs: 'Metal', color: '#71717a' },
  { value: 'zirconia', label: 'Zirconia', labelEs: 'Zirconio', color: '#f1f5f9' },
  { value: 'gold', label: 'Gold', labelEs: 'Oro', color: '#fbbf24' },
  { value: 'glass_ionomer', label: 'Glass Ionomer', labelEs: 'Ionómero', color: '#bfdbfe' },
  { value: 'temporary', label: 'Temporary', labelEs: 'Temporal', color: '#fcd34d' }
];

const surfaces: { value: ToothSurface; label: string; shortLabel: string }[] = [
  { value: 'occlusal', label: 'Oclusal', shortLabel: 'O' },
  { value: 'mesial', label: 'Mesial', shortLabel: 'M' },
  { value: 'distal', label: 'Distal', shortLabel: 'D' },
  { value: 'buccal', label: 'Vestibular', shortLabel: 'V' },
  { value: 'lingual', label: 'Lingual/Palatino', shortLabel: 'L' },
  { value: 'incisal', label: 'Incisal', shortLabel: 'I' }
];

// Adult tooth positions (FDI notation)
const upperTeethAdult = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeethAdult = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Pediatric tooth positions (FDI notation)
const upperTeethPediatric = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerTeethPediatric = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const getToothType = (number: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
  const lastDigit = number % 10;
  if (number > 50) {
    // Pediatric teeth
    if (lastDigit >= 4) return 'molar';
    if (lastDigit === 3) return 'canine';
    return 'incisor';
  }
  // Adult teeth
  if (lastDigit >= 6) return 'molar';
  if (lastDigit >= 4) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor';
};

// Default surface data helper
const createDefaultSurfaces = (): Record<ToothSurface, { condition: ToothCondition; material?: MaterialType }> => ({
  occlusal: { condition: 'healthy' },
  mesial: { condition: 'healthy' },
  distal: { condition: 'healthy' },
  buccal: { condition: 'healthy' },
  lingual: { condition: 'healthy' },
  incisal: { condition: 'healthy' }
});

export const EnhancedOdontogram = ({ patientId, patientName, readOnly = false }: EnhancedOdontogramProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('healthy');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('composite');
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'buccal' | 'palatal' | 'occlusal'>('buccal');
  const [patientType, setPatientType] = useState<'adult' | 'pediatric'>('adult');
  const [toothData, setToothData] = useState<Record<number, ToothData>>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<Record<number, ToothData>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<number, ToothData>[]>([]);

  const upperTeeth = patientType === 'adult' ? upperTeethAdult : upperTeethPediatric;
  const lowerTeeth = patientType === 'adult' ? lowerTeethAdult : lowerTeethPediatric;

  // Fetch existing data
  const { isLoading } = useQuery({
    queryKey: ['odontogram-enhanced', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('odontogram')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      
      if (error) throw error;
      
      const transformed: Record<number, ToothData> = {};
      data?.forEach((item: any) => {
        if (!transformed[item.tooth_number]) {
          transformed[item.tooth_number] = {
            number: item.tooth_number,
            condition: item.condition as ToothCondition,
            surfaces: createDefaultSurfaces(),
            notes: item.notes,
            lastUpdated: item.recorded_at,
            treatments: []
          };
        }
        if (item.surface) {
          const surfaceMap: Record<string, ToothSurface> = {
            'O': 'occlusal', 'M': 'mesial', 'D': 'distal', 
            'V': 'buccal', 'L': 'lingual', 'I': 'incisal'
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

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTooth) return;
      
      // Save current state to undo stack
      setUndoStack(prev => [...prev, { ...toothData }]);
      setRedoStack([]);
      
      const { data: user } = await supabase.auth.getUser();
      const currentTooth = toothData[selectedTooth];
      
      // Delete existing and insert new
      await supabase.from('odontogram').delete()
        .eq('patient_id', patientId)
        .eq('tooth_number', selectedTooth);
      
      // Insert main condition
      await supabase.from('odontogram').insert({
        patient_id: patientId,
        tooth_number: selectedTooth,
        condition: selectedCondition,
        notes,
        recorded_by: user.user?.id
      });

      // Insert surface conditions
      if (currentTooth) {
        for (const [surface, data] of Object.entries(currentTooth.surfaces)) {
          if (data.condition !== 'healthy') {
            const surfaceMap: Record<string, string> = {
              'occlusal': 'O', 'mesial': 'M', 'distal': 'D', 
              'buccal': 'V', 'lingual': 'L', 'incisal': 'I'
            };
            await supabase.from('odontogram').insert({
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram-enhanced', patientId] });
      toast({ title: "Guardado", description: "Odontograma actualizado correctamente" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  });

  // Undo/Redo functions
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { ...toothData }]);
    setUndoStack(prev => prev.slice(0, -1));
    setToothData(previousState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { ...toothData }]);
    setRedoStack(prev => prev.slice(0, -1));
    setToothData(nextState);
  };

  // Handle tooth click
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

  // Update surface condition
  const updateSurfaceCondition = (surface: ToothSurface, condition: ToothCondition, material?: MaterialType) => {
    if (!selectedTooth) return;
    
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
            ...(existing?.surfaces || createDefaultSurfaces()),
            [surface]: { condition, material }
          }
        }
      };
    });
  };

  // Get color for condition
  const getConditionColor = (condition: ToothCondition): string => {
    return conditions.find(c => c.value === condition)?.color || '#22c55e';
  };

  // Statistics
  const stats = useMemo(() => {
    const allTeeth = [...upperTeeth, ...lowerTeeth];
    const total = allTeeth.length;
    const healthy = allTeeth.filter(t => !toothData[t] || toothData[t].condition === 'healthy').length;
    const withConditions = total - healthy;
    const caries = Object.values(toothData).filter(t => t.condition === 'caries').length;
    const missing = Object.values(toothData).filter(t => t.condition === 'missing').length;
    const treated = Object.values(toothData).filter(t => ['filled', 'crown', 'root_canal', 'implant'].includes(t.condition)).length;
    
    return { total, healthy, withConditions, caries, missing, treated };
  }, [toothData, upperTeeth, lowerTeeth]);

  // SVG Tooth Component
  const ToothSVG = ({ number, isUpper }: { number: number; isUpper: boolean }) => {
    const tooth = toothData[number];
    const condition = tooth?.condition || 'healthy';
    const toothType = getToothType(number);
    const isMissing = condition === 'missing';
    const surfaceColors = tooth?.surfaces || createDefaultSurfaces();
    const isPediatric = patientType === 'pediatric';

    const baseSize = isPediatric ? 0.85 : 1;
    
    // Molar rendering
    const renderMolarSVG = () => (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        {/* Roots */}
        <g className="roots" opacity={isMissing ? 0.3 : 1}>
          {isUpper ? (
            <>
              <path d="M25,60 Q20,90 22,115" fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
              <path d="M50,60 Q50,85 50,115" fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
              <path d="M75,60 Q80,90 78,115" fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M30,60 Q25,85 28,115" fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="10" strokeLinecap="round" />
              <path d="M70,60 Q75,85 72,115" fill="none" stroke={isMissing ? '#ccc' : '#d4a574'} strokeWidth="10" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Crown with 5-surface representation */}
        <g className="crown">
          {/* Main crown outline */}
          <rect 
            x="10" y="5" width="80" height="55" rx="10"
            fill={isMissing ? 'transparent' : getConditionColor(condition)}
            stroke={isMissing ? '#ccc' : '#333'}
            strokeWidth="2"
            strokeDasharray={isMissing ? '5,5' : 'none'}
          />
          
          {!isMissing && (
            <>
              {/* Buccal (top) */}
              <path 
                d="M15,5 L85,5 Q90,5 90,10 L90,18 L10,18 L10,10 Q10,5 15,5 Z"
                fill={getConditionColor(surfaceColors.buccal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Mesial (left) */}
              <path 
                d="M10,18 L25,18 L25,42 L10,42 L10,18 Z"
                fill={getConditionColor(surfaceColors.mesial?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Occlusal (center) */}
              <rect 
                x="25" y="18" width="50" height="24" rx="3"
                fill={getConditionColor(surfaceColors.occlusal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Distal (right) */}
              <path 
                d="M75,18 L90,18 L90,42 L75,42 L75,18 Z"
                fill={getConditionColor(surfaceColors.distal?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
              
              {/* Lingual (bottom) */}
              <path 
                d="M10,42 L90,42 L90,55 Q90,60 85,60 L15,60 Q10,60 10,55 L10,42 Z"
                fill={getConditionColor(surfaceColors.lingual?.condition || 'healthy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80"
              />
            </>
          )}

          {/* Condition indicators */}
          {condition === 'crown' && !isMissing && (
            <circle cx="50" cy="30" r="18" fill="none" stroke="#fff" strokeWidth="3" />
          )}
          {condition === 'root_canal' && !isMissing && (
            <>
              <line x1="35" y1="18" x2="65" y2="42" stroke="#fff" strokeWidth="2" />
              <line x1="65" y1="18" x2="35" y2="42" stroke="#fff" strokeWidth="2" />
            </>
          )}
          {condition === 'implant' && (
            <path d="M45,55 L50,110 L55,55" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
          )}
          {condition === 'extraction_indicated' && !isMissing && (
            <>
              <line x1="15" y1="10" x2="85" y2="55" stroke="#f97316" strokeWidth="3" />
              <line x1="85" y1="10" x2="15" y2="55" stroke="#f97316" strokeWidth="3" />
            </>
          )}
        </g>
      </svg>
    );

    // Premolar rendering
    const renderPremolarSVG = () => (
      <svg viewBox="0 0 80 110" className="w-full h-full">
        <path 
          d={isUpper ? "M40,55 Q35,80 38,105" : "M40,55 Q40,80 40,105"} 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="12" 
          strokeLinecap="round"
          opacity={isMissing ? 0.3 : 1}
        />
        
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
            className="cursor-pointer"
          />
        )}

        {condition === 'extraction_indicated' && !isMissing && (
          <>
            <line x1="15" y1="10" x2="65" y2="50" stroke="#f97316" strokeWidth="3" />
            <line x1="65" y1="10" x2="15" y2="50" stroke="#f97316" strokeWidth="3" />
          </>
        )}
      </svg>
    );

    // Canine rendering
    const renderCanineSVG = () => (
      <svg viewBox="0 0 60 120" className="w-full h-full">
        <path 
          d="M30,50 Q30,85 30,115" 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="14" 
          strokeLinecap="round"
          opacity={isMissing ? 0.3 : 1}
        />
        
        <path 
          d="M10,50 L30,5 L50,50 Q50,55 30,55 Q10,55 10,50 Z"
          fill={isMissing ? 'transparent' : getConditionColor(condition)}
          stroke={isMissing ? '#ccc' : '#333'}
          strokeWidth="2"
          strokeDasharray={isMissing ? '5,5' : 'none'}
        />

        {condition === 'extraction_indicated' && !isMissing && (
          <>
            <line x1="12" y1="10" x2="48" y2="50" stroke="#f97316" strokeWidth="3" />
            <line x1="48" y1="10" x2="12" y2="50" stroke="#f97316" strokeWidth="3" />
          </>
        )}
      </svg>
    );

    // Incisor rendering
    const renderIncisorSVG = () => (
      <svg viewBox="0 0 50 100" className="w-full h-full">
        <path 
          d="M25,45 Q25,70 25,95" 
          fill="none" 
          stroke={isMissing ? '#ccc' : '#d4a574'} 
          strokeWidth="10" 
          strokeLinecap="round"
          opacity={isMissing ? 0.3 : 1}
        />
        
        <rect 
          x="5" y="5" width="40" height="40" rx="5"
          fill={isMissing ? 'transparent' : getConditionColor(condition)}
          stroke={isMissing ? '#ccc' : '#333'}
          strokeWidth="2"
          strokeDasharray={isMissing ? '5,5' : 'none'}
        />

        {!isMissing && (
          <rect 
            x="12" y="35" width="26" height="8" rx="2"
            fill={getConditionColor(surfaceColors.incisal?.condition || 'healthy')}
            stroke="#fff"
            strokeWidth="1"
          />
        )}

        {condition === 'extraction_indicated' && !isMissing && (
          <>
            <line x1="8" y1="8" x2="42" y2="42" stroke="#f97316" strokeWidth="3" />
            <line x1="42" y1="8" x2="8" y2="42" stroke="#f97316" strokeWidth="3" />
          </>
        )}
      </svg>
    );

    return (
      <motion.div
        className={`cursor-pointer relative group ${isMissing ? 'opacity-50' : ''}`}
        style={{ 
          width: (toothType === 'molar' ? 55 : toothType === 'premolar' ? 45 : 38) * baseSize * zoom,
          height: (toothType === 'molar' ? 75 : 65) * baseSize * zoom
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleToothClick(number)}
      >
        {toothType === 'molar' && renderMolarSVG()}
        {toothType === 'premolar' && renderPremolarSVG()}
        {toothType === 'canine' && renderCanineSVG()}
        {toothType === 'incisor' && renderIncisorSVG()}
        
        {/* Tooth number */}
        <div className={`absolute ${isUpper ? 'bottom-[-18px]' : 'top-[-18px]'} left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors`}>
          {number}
        </div>

        {/* Condition indicator badge */}
        {condition !== 'healthy' && !isMissing && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border-2 flex items-center justify-center text-[8px] font-bold"
               style={{ borderColor: getConditionColor(condition), color: getConditionColor(condition) }}>
            {conditions.find(c => c.value === condition)?.icon || '!'}
          </div>
        )}
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
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Odontograma Interactivo</CardTitle>
          {patientName && <Badge variant="secondary">{patientName}</Badge>}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Patient type toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={patientType === 'adult' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPatientType('adult')}
              className="gap-1 rounded-none"
            >
              <UserRound className="w-4 h-4" />
              Adulto
            </Button>
            <Button
              variant={patientType === 'pediatric' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPatientType('pediatric')}
              className="gap-1 rounded-none"
            >
              <Baby className="w-4 h-4" />
              Pediátrico
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View mode */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buccal">Vestibular</SelectItem>
              <SelectItem value="palatal">Palatino</SelectItem>
              <SelectItem value="occlusal">Oclusal</SelectItem>
            </SelectContent>
          </Select>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <Button variant="outline" size="icon" onClick={handleUndo} disabled={undoStack.length === 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRedo} disabled={redoStack.length === 0}>
            <Redo2 className="w-4 h-4" />
          </Button>

          {/* History */}
          <Button variant="outline" size="icon" onClick={() => setHistoryDialogOpen(true)}>
            <History className="w-4 h-4" />
          </Button>

          {/* Print */}
          <Button variant="outline" size="icon" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics Bar */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.healthy}</div>
            <div className="text-xs text-muted-foreground">Sanos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.withConditions}</div>
            <div className="text-xs text-muted-foreground">Con Hallazgos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.caries}</div>
            <div className="text-xs text-muted-foreground">Caries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.missing}</div>
            <div className="text-xs text-muted-foreground">Ausentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.treated}</div>
            <div className="text-xs text-muted-foreground">Tratados</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {conditions.slice(0, 8).map((cond) => (
            <Badge 
              key={cond.value}
              variant="outline" 
              className="gap-1 text-xs"
              style={{ borderColor: cond.color }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cond.color }} />
              {cond.labelEs}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">+ más...</Badge>
        </div>

        {/* Odontogram Display */}
        <div className="flex flex-col items-center gap-6 py-6 overflow-x-auto">
          {/* Upper Arch */}
          <div className="relative">
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Arcada Superior
            </div>
            <div className="flex items-end gap-0.5 p-4 bg-gradient-to-b from-primary/5 to-transparent rounded-t-[100px] border-t border-x border-dashed border-muted">
              {upperTeeth.map((num) => (
                <ToothSVG key={num} number={num} isUpper={true} />
              ))}
            </div>
          </div>

          {/* Midline */}
          <div className="w-full max-w-2xl h-px bg-border relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-muted-foreground font-medium">
              LÍNEA MEDIA
            </div>
            <div className="absolute left-1/2 w-0.5 h-6 bg-primary/50 -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Lower Arch */}
          <div className="relative">
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Arcada Inferior
            </div>
            <div className="flex items-start gap-0.5 p-4 bg-gradient-to-t from-primary/5 to-transparent rounded-b-[100px] border-b border-x border-dashed border-muted">
              {lowerTeeth.map((num) => (
                <ToothSVG key={num} number={num} isUpper={false} />
              ))}
            </div>
          </div>
        </div>

        {/* Quadrant Labels */}
        <div className="flex justify-center gap-8 text-xs text-muted-foreground">
          <span>Q1: Superior Derecho</span>
          <span>Q2: Superior Izquierdo</span>
          <span>Q3: Inferior Izquierdo</span>
          <span>Q4: Inferior Derecho</span>
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                  {selectedTooth}
                </div>
                Diente {selectedTooth} - {getToothType(selectedTooth || 0).charAt(0).toUpperCase() + getToothType(selectedTooth || 0).slice(1)}
              </DialogTitle>
              <DialogDescription>
                Registrar condición y tratamientos para este diente
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="condition" className="mt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="condition">Condición</TabsTrigger>
                <TabsTrigger value="surfaces">Superficies</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="condition" className="space-y-4 mt-4">
                <Label className="text-sm font-medium">Condición General del Diente</Label>
                <div className="grid grid-cols-4 gap-2">
                  {conditions.map((cond) => (
                    <Button
                      key={cond.value}
                      variant={selectedCondition === cond.value ? 'default' : 'outline'}
                      className="gap-2 h-auto py-2 flex-col"
                      onClick={() => setSelectedCondition(cond.value)}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cond.color }} />
                      <span className="text-xs">{cond.labelEs}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="surfaces" className="space-y-4 mt-4">
                <Label className="text-sm font-medium">Seleccionar Superficie</Label>
                <div className="flex gap-2 flex-wrap">
                  {surfaces.map((surface) => (
                    <Button
                      key={surface.value}
                      variant={selectedSurface === surface.value ? 'default' : 'outline'}
                      onClick={() => setSelectedSurface(surface.value)}
                      className="gap-1"
                    >
                      <span className="font-bold">{surface.shortLabel}</span>
                      <span className="text-xs">({surface.label})</span>
                    </Button>
                  ))}
                </div>
                
                {selectedSurface && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-sm">Condición de superficie: {surfaces.find(s => s.value === selectedSurface)?.label}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {conditions.slice(0, 8).map((cond) => (
                        <Button
                          key={cond.value}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => updateSurfaceCondition(selectedSurface, cond.value, selectedMaterial)}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cond.color }} />
                          <span className="text-xs">{cond.labelEs}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="material" className="space-y-4 mt-4">
                <Label className="text-sm font-medium">Material de Restauración</Label>
                <div className="grid grid-cols-4 gap-2">
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
                      <span className="text-xs">{mat.labelEs}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <Label className="text-sm font-medium">Historial de Tratamientos</Label>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  {toothData[selectedTooth!]?.treatments?.length ? (
                    toothData[selectedTooth!].treatments!.map((treatment) => (
                      <div key={treatment.id} className="flex items-center gap-2 p-2 border-b last:border-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{treatment.date}</span>
                        <Badge variant="outline">{treatment.condition}</Badge>
                        {treatment.notes && <span className="text-xs text-muted-foreground">{treatment.notes}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Sin historial registrado
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Notas Clínicas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre el diente..."
                rows={3}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Historial del Odontograma</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {Object.entries(toothData).map(([tooth, data]) => (
                  <div key={tooth} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{tooth}</span>
                      <Badge style={{ backgroundColor: getConditionColor(data.condition), color: '#fff' }}>
                        {conditions.find(c => c.value === data.condition)?.labelEs}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))}
                {Object.keys(toothData).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay registros aún
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EnhancedOdontogram;
