import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, RotateCcw, ZoomIn, ZoomOut, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OdontogramProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

type NotationSystem = 'fdi' | 'universal' | 'palmer';

const conditions = [
  { value: "sano", label: "Sano", color: "#22c55e", bgClass: "bg-green-500" },
  { value: "caries", label: "Caries", color: "#ef4444", bgClass: "bg-red-500" },
  { value: "obturado", label: "Obturado", color: "#3b82f6", bgClass: "bg-blue-500" },
  { value: "ausente", label: "Ausente", color: "#6b7280", bgClass: "bg-gray-500" },
  { value: "corona", label: "Corona", color: "#eab308", bgClass: "bg-yellow-500" },
  { value: "endodoncia", label: "Endodoncia", color: "#a855f7", bgClass: "bg-purple-500" },
  { value: "implante", label: "Implante", color: "#06b6d4", bgClass: "bg-cyan-500" },
  { value: "protesis", label: "Prótesis", color: "#f97316", bgClass: "bg-orange-500" },
  { value: "fractura", label: "Fractura", color: "#ec4899", bgClass: "bg-pink-500" },
  { value: "movilidad", label: "Movilidad", color: "#d97706", bgClass: "bg-amber-600" },
];

const surfaces = [
  { value: "V", label: "Vestibular", description: "Cara externa" },
  { value: "L", label: "Lingual/Palatino", description: "Cara interna" },
  { value: "M", label: "Mesial", description: "Cara hacia el centro" },
  { value: "D", label: "Distal", description: "Cara hacia atrás" },
  { value: "O", label: "Oclusal/Incisal", description: "Cara de mordida" },
];

// Adult teeth (FDI notation) - stored internally
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Primary teeth (FDI)
const upperPrimaryTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerPrimaryTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Universal Numbering System (ADA) mapping
const fdiToUniversal: Record<number, number | string> = {
  // Upper right to upper left (1-16)
  18: 1, 17: 2, 16: 3, 15: 4, 14: 5, 13: 6, 12: 7, 11: 8,
  21: 9, 22: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
  // Lower left to lower right (17-32)
  38: 17, 37: 18, 36: 19, 35: 20, 34: 21, 33: 22, 32: 23, 31: 24,
  41: 25, 42: 26, 43: 27, 44: 28, 45: 29, 46: 30, 47: 31, 48: 32,
  // Primary teeth (A-T)
  55: 'A', 54: 'B', 53: 'C', 52: 'D', 51: 'E',
  61: 'F', 62: 'G', 63: 'H', 64: 'I', 65: 'J',
  75: 'K', 74: 'L', 73: 'M', 72: 'N', 71: 'O',
  81: 'P', 82: 'Q', 83: 'R', 84: 'S', 85: 'T',
};

// Palmer Notation mapping (quadrant + number)
const fdiToPalmer: Record<number, string> = {
  // Upper right (⏋)
  18: '8⏋', 17: '7⏋', 16: '6⏋', 15: '5⏋', 14: '4⏋', 13: '3⏋', 12: '2⏋', 11: '1⏋',
  // Upper left (⏌)
  21: '⏌1', 22: '⏌2', 23: '⏌3', 24: '⏌4', 25: '⏌5', 26: '⏌6', 27: '⏌7', 28: '⏌8',
  // Lower left (⎿)
  38: '⎿8', 37: '⎿7', 36: '⎿6', 35: '⎿5', 34: '⎿4', 33: '⎿3', 32: '⎿2', 31: '⎿1',
  // Lower right (⏌)
  41: '1⎾', 42: '2⎾', 43: '3⎾', 44: '4⎾', 45: '5⎾', 46: '6⎾', 47: '7⎾', 48: '8⎾',
  // Primary teeth
  55: 'E⏋', 54: 'D⏋', 53: 'C⏋', 52: 'B⏋', 51: 'A⏋',
  61: '⏌A', 62: '⏌B', 63: '⏌C', 64: '⏌D', 65: '⏌E',
  75: '⎿E', 74: '⎿D', 73: '⎿C', 72: '⎿B', 71: '⎿A',
  81: 'A⎾', 82: 'B⎾', 83: 'C⎾', 84: 'D⎾', 85: 'E⎾',
};

// Helper to get tooth number based on notation system
const getToothLabel = (fdiNumber: number, notation: NotationSystem): string => {
  switch (notation) {
    case 'universal':
      return String(fdiToUniversal[fdiNumber] || fdiNumber);
    case 'palmer':
      return fdiToPalmer[fdiNumber] || String(fdiNumber);
    case 'fdi':
    default:
      return String(fdiNumber);
  }
};

// Tooth types for visual representation
const getToothType = (number: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
  const lastDigit = number % 10;
  if (lastDigit >= 6) return 'molar';
  if (lastDigit >= 4) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor';
};

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
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showPrimary, setShowPrimary] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [notation, setNotation] = useState<NotationSystem>('fdi');

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
    setSelectedSurfaces([]);
    setSelectedCondition("");
    setNotes("");
  };

  const getToothCondition = (toothNumber: number): string => {
    const tooth = toothData?.find(t => t.tooth_number === toothNumber && !t.surface);
    return tooth?.condition || "sano";
  };

  const getSurfaceCondition = (toothNumber: number, surface: string): string | null => {
    const surfaceData = toothData?.find(t => t.tooth_number === toothNumber && t.surface === surface);
    return surfaceData?.condition || null;
  };

  const getConditionColor = (condition: string): string => {
    return conditions.find(c => c.value === condition)?.color || "#d1d5db";
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly) return;
    setSelectedTooth(toothNumber);
    const existing = toothData?.find(t => t.tooth_number === toothNumber && !t.surface);
    if (existing) {
      setSelectedCondition(existing.condition);
      setNotes(existing.notes || "");
    } else {
      setSelectedCondition("");
      setNotes("");
    }
    setSelectedSurfaces([]);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTooth || !selectedCondition) return;
    
    if (selectedSurfaces.length === 0) {
      // Save for whole tooth
      saveMutation.mutate({
        tooth_number: selectedTooth,
        surface: undefined,
        condition: selectedCondition,
        notes: notes || undefined,
      });
    } else {
      // Save for each selected surface
      selectedSurfaces.forEach(surface => {
        saveMutation.mutate({
          tooth_number: selectedTooth,
          surface,
          condition: selectedCondition,
          notes: notes || undefined,
        });
      });
    }
  };

  const toggleSurface = (surface: string) => {
    setSelectedSurfaces(prev => 
      prev.includes(surface) 
        ? prev.filter(s => s !== surface)
        : [...prev, surface]
    );
  };

  // Interactive tooth SVG component
  const ToothSVG = ({ number, isUpper }: { number: number; isUpper: boolean }) => {
    const condition = getToothCondition(number);
    const baseColor = getConditionColor(condition);
    const toothType = getToothType(number);
    const isHovered = hoveredTooth === number;
    const isAbsent = condition === "ausente";

    // Get surface conditions
    const surfaceColors = {
      O: getSurfaceCondition(number, "O"),
      V: getSurfaceCondition(number, "V"),
      L: getSurfaceCondition(number, "L"),
      M: getSurfaceCondition(number, "M"),
      D: getSurfaceCondition(number, "D"),
    };

    const getToothPath = () => {
      switch (toothType) {
        case 'molar':
          return isUpper 
            ? "M5,8 Q2,8 2,15 L2,35 Q2,42 8,42 L32,42 Q38,42 38,35 L38,15 Q38,8 35,8 Q32,2 20,2 Q8,2 5,8 Z"
            : "M5,2 Q2,2 2,9 L2,29 Q2,36 8,38 Q14,42 20,42 Q26,42 32,38 Q38,36 38,29 L38,9 Q38,2 35,2 L5,2 Z";
        case 'premolar':
          return isUpper
            ? "M8,6 Q4,6 4,12 L4,34 Q4,40 10,40 L26,40 Q32,40 32,34 L32,12 Q32,6 28,6 Q24,2 18,2 Q12,2 8,6 Z"
            : "M8,2 Q4,2 4,8 L4,30 Q4,36 10,38 Q14,42 18,42 Q22,42 26,38 Q32,36 32,30 L32,8 Q32,2 28,2 L8,2 Z";
        case 'canine':
          return isUpper
            ? "M10,4 Q6,4 6,10 L6,36 Q6,42 12,42 L24,42 Q30,42 30,36 L30,10 Q30,4 26,4 Q22,0 18,0 Q14,0 10,4 Z"
            : "M10,0 Q6,0 6,6 L6,32 Q6,38 12,40 Q15,44 18,44 Q21,44 24,40 Q30,38 30,32 L30,6 Q30,0 26,0 L10,0 Z";
        default: // incisor
          return isUpper
            ? "M8,3 Q4,3 4,9 L4,37 Q4,43 10,43 L26,43 Q32,43 32,37 L32,9 Q32,3 28,3 Q24,0 18,0 Q12,0 8,3 Z"
            : "M8,0 Q4,0 4,6 L4,34 Q4,40 10,42 Q14,46 18,46 Q22,46 26,42 Q32,40 32,34 L32,6 Q32,0 28,0 L8,0 Z";
      }
    };

    const width = toothType === 'molar' ? 40 : toothType === 'premolar' ? 36 : 36;
    const height = toothType === 'molar' ? 44 : toothType === 'incisor' ? 46 : 44;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="relative cursor-pointer"
              onClick={() => handleToothClick(number)}
              onMouseEnter={() => setHoveredTooth(number)}
              onMouseLeave={() => setHoveredTooth(null)}
              whileHover={{ scale: 1.15, y: isUpper ? 5 : -5 }}
              whileTap={{ scale: 0.95 }}
              style={{ transform: `scale(${zoom})` }}
            >
              <svg 
                width={width} 
                height={height} 
                viewBox={`0 0 ${width} ${height}`}
                className="drop-shadow-md"
              >
                {/* Main tooth shape */}
                <motion.path
                  d={getToothPath()}
                  fill={isAbsent ? "transparent" : baseColor}
                  stroke={isAbsent ? "#9ca3af" : isHovered ? "#1f2937" : "#374151"}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={isAbsent ? "4,4" : "none"}
                  initial={false}
                  animate={{ 
                    fill: isAbsent ? "transparent" : baseColor,
                    strokeWidth: isHovered ? 2.5 : 1.5 
                  }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Surface divisions for molars/premolars */}
                {(toothType === 'molar' || toothType === 'premolar') && !isAbsent && (
                  <>
                    {/* Center (Occlusal) */}
                    <circle 
                      cx={width/2} 
                      cy={height/2} 
                      r={8}
                      fill={surfaceColors.O ? getConditionColor(surfaceColors.O) : baseColor}
                      stroke="#ffffff50"
                      strokeWidth={1}
                    />
                    {/* Vestibular indicator */}
                    {surfaceColors.V && (
                      <rect 
                        x={width/2 - 4} 
                        y={isUpper ? height - 10 : 2} 
                        width={8} 
                        height={6}
                        fill={getConditionColor(surfaceColors.V)}
                        rx={2}
                      />
                    )}
                    {/* Lingual indicator */}
                    {surfaceColors.L && (
                      <rect 
                        x={width/2 - 4} 
                        y={isUpper ? 4 : height - 10} 
                        width={8} 
                        height={6}
                        fill={getConditionColor(surfaceColors.L)}
                        rx={2}
                      />
                    )}
                    {/* Mesial indicator */}
                    {surfaceColors.M && (
                      <rect 
                        x={2} 
                        y={height/2 - 4} 
                        width={6} 
                        height={8}
                        fill={getConditionColor(surfaceColors.M)}
                        rx={2}
                      />
                    )}
                    {/* Distal indicator */}
                    {surfaceColors.D && (
                      <rect 
                        x={width - 8} 
                        y={height/2 - 4} 
                        width={6} 
                        height={8}
                        fill={getConditionColor(surfaceColors.D)}
                        rx={2}
                      />
                    )}
                  </>
                )}

                {/* Root indication for implants */}
                {condition === 'implante' && (
                  <line 
                    x1={width/2} 
                    y1={isUpper ? 0 : height} 
                    x2={width/2} 
                    y2={isUpper ? -8 : height + 8}
                    stroke="#06b6d4"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                )}

                {/* Crown indicator */}
                {condition === 'corona' && (
                  <circle 
                    cx={width/2} 
                    cy={height/2} 
                    r={width/3}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}

                {/* Endodontics indicator */}
                {condition === 'endodoncia' && (
                  <>
                    <line x1={width/2 - 6} y1={height/2 - 6} x2={width/2 + 6} y2={height/2 + 6} stroke="#fff" strokeWidth={2} />
                    <line x1={width/2 + 6} y1={height/2 - 6} x2={width/2 - 6} y2={height/2 + 6} stroke="#fff" strokeWidth={2} />
                  </>
                )}

                {/* Fracture indicator */}
                {condition === 'fractura' && (
                  <path
                    d={`M${width/4},${height/3} L${width/2},${height/2} L${width*3/4},${height/3} L${width/2},${height*2/3} Z`}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </svg>

              {/* Tooth number */}
              <div className={`absolute ${isUpper ? '-bottom-5' : '-top-5'} left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground`}>
                {getToothLabel(number, notation)}
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side={isUpper ? "bottom" : "top"} className="p-3">
            <div className="text-sm">
              <p className="font-semibold">Diente {getToothLabel(number, notation)}</p>
              <p className="text-xs text-muted-foreground mb-1">
                FDI: {number} | Universal: {fdiToUniversal[number]} | Palmer: {fdiToPalmer[number]}
              </p>
              <p className="text-muted-foreground capitalize">{conditions.find(c => c.value === condition)?.label || "Sano"}</p>
              {Object.entries(surfaceColors).map(([surface, cond]) => 
                cond && (
                  <p key={surface} className="text-xs">
                    {surfaces.find(s => s.value === surface)?.label}: {conditions.find(c => c.value === cond)?.label}
                  </p>
                )
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <motion.span 
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🦷
            </motion.span>
            <div>
              <h3 className="text-xl font-semibold">Odontograma</h3>
              {patientName && <p className="text-sm text-muted-foreground font-normal">{patientName}</p>}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant={showPrimary ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPrimary(!showPrimary)}
            >
              {showPrimary ? "Permanentes" : "Temporales"}
            </Button>
            <Select value={notation} onValueChange={(val) => setNotation(val as NotationSystem)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fdi">FDI (ISO)</SelectItem>
                <SelectItem value="universal">Universal (ADA)</SelectItem>
                <SelectItem value="palmer">Palmer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-8 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-1 mr-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Leyenda:</span>
          </div>
          {conditions.map(c => (
            <motion.div
              key={c.value}
              whileHover={{ scale: 1.05 }}
              className="cursor-default"
            >
              <Badge 
                className="text-white shadow-sm" 
                style={{ backgroundColor: c.color }}
              >
                {c.label}
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Dental Arches Container */}
        <div className="relative bg-gradient-to-b from-muted/20 via-transparent to-muted/20 rounded-3xl p-8">
          {/* Upper Arch Label */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-muted-foreground bg-background px-4 py-1 rounded-full border">
              Arcada Superior
            </span>
          </div>

          {/* Upper Arch */}
          <div className="flex justify-center items-end gap-1 mb-8 pt-6 pb-2">
            <AnimatePresence>
              {currentUpperTeeth.map((tooth, index) => (
                <motion.div
                  key={tooth}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ToothSVG number={tooth} isUpper={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mouth divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-primary/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-primary text-sm font-medium">
                Línea de Oclusión
              </span>
            </div>
          </div>

          {/* Lower Arch */}
          <div className="flex justify-center items-start gap-1 mt-8 pb-6 pt-2">
            <AnimatePresence>
              {currentLowerTeeth.map((tooth, index) => (
                <motion.div
                  key={tooth}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ToothSVG number={tooth} isUpper={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Lower Arch Label */}
          <div className="text-center mt-4">
            <span className="text-sm font-medium text-muted-foreground bg-background px-4 py-1 rounded-full border">
              Arcada Inferior
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Sanos", value: toothData?.filter(t => t.condition === 'sano').length || 0, color: "text-green-500" },
            { label: "Con Caries", value: toothData?.filter(t => t.condition === 'caries').length || 0, color: "text-red-500" },
            { label: "Tratados", value: toothData?.filter(t => ['obturado', 'corona', 'endodoncia'].includes(t.condition)).length || 0, color: "text-blue-500" },
            { label: "Ausentes", value: toothData?.filter(t => t.condition === 'ausente').length || 0, color: "text-gray-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-muted/30 rounded-xl p-4 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">🦷</span>
                Diente #{selectedTooth}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Condition Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Condición</label>
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map(c => (
                    <motion.button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedCondition(c.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        selectedCondition === c.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-sm">{c.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Surface Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Superficies <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {surfaces.map(s => (
                    <motion.button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSurface(s.value)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all ${
                        selectedSurfaces.includes(s.value)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="font-bold">{s.value}</span>
                      <span className="text-xs block opacity-70">{s.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Notas</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!selectedCondition || saveMutation.isPending}
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
