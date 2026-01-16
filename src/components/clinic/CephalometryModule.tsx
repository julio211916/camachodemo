import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, Ruler, Circle, Target, Eye, EyeOff, 
  ZoomIn, ZoomOut, RotateCw, Move, Save, Trash2, Edit2,
  Maximize2, FileText, Image as ImageIcon, Loader2, Check, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Cephalometric landmarks definition
const CEPHALOMETRIC_LANDMARKS = [
  { id: 'S', name: 'Sella', description: 'Centro de la silla turca', color: '#ef4444' },
  { id: 'N', name: 'Nasion', description: 'Punto más anterior de la sutura frontonasal', color: '#f97316' },
  { id: 'Po', name: 'Porion', description: 'Punto más superior del meato auditivo externo', color: '#eab308' },
  { id: 'Or', name: 'Orbitale', description: 'Punto más inferior del reborde orbitario', color: '#22c55e' },
  { id: 'ANS', name: 'ANS', description: 'Espina nasal anterior', color: '#06b6d4' },
  { id: 'PNS', name: 'PNS', description: 'Espina nasal posterior', color: '#3b82f6' },
  { id: 'A', name: 'Punto A', description: 'Punto más posterior de la concavidad anterior del maxilar', color: '#8b5cf6' },
  { id: 'B', name: 'Punto B', description: 'Punto más posterior de la concavidad anterior de la mandíbula', color: '#ec4899' },
  { id: 'Pg', name: 'Pogonion', description: 'Punto más anterior de la sínfisis mentoniana', color: '#14b8a6' },
  { id: 'Gn', name: 'Gnathion', description: 'Punto más anteroinferior de la sínfisis', color: '#f43f5e' },
  { id: 'Me', name: 'Menton', description: 'Punto más inferior de la sínfisis mentoniana', color: '#a855f7' },
  { id: 'Go', name: 'Gonion', description: 'Punto más posteroinferior del ángulo mandibular', color: '#0ea5e9' },
];

// Standard cephalometric analyses
const CEPH_ANALYSES = [
  { id: 'ricketts', name: 'Ricketts', description: 'Análisis de Ricketts' },
  { id: 'steiner', name: 'Steiner', description: 'Análisis de Steiner' },
  { id: 'mcnamara', name: 'McNamara', description: 'Análisis de McNamara' },
  { id: 'bjork-jarabak', name: 'Björk-Jarabak', description: 'Análisis de Björk-Jarabak' },
];

interface LandmarkPoint {
  id: string;
  landmarkId: string;
  x: number;
  y: number;
  visible: boolean;
}

interface CephalometryModuleProps {
  patientId?: string;
  patientName?: string;
}

export const CephalometryModule = ({ patientId, patientName }: CephalometryModuleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'place' | 'measure'>('select');
  const [analysisType, setAnalysisType] = useState('ricketts');
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch patient's cephalometric images
  const { data: cephImages = [], isLoading } = useQuery({
    queryKey: ['ceph-images', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .ilike('document_type', '%ceph%')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  // Calculate angles and measurements based on placed landmarks
  const calculateMeasurements = useCallback(() => {
    const measurements: { name: string; value: number; normal: string; unit: string }[] = [];
    
    const getLandmark = (id: string) => landmarks.find(l => l.landmarkId === id);
    
    // SNA Angle (S-N-A)
    const S = getLandmark('S');
    const N = getLandmark('N');
    const A = getLandmark('A');
    
    if (S && N && A) {
      const angle = calculateAngle(S, N, A);
      measurements.push({
        name: 'SNA',
        value: angle,
        normal: '82° ± 2°',
        unit: '°'
      });
    }
    
    // SNB Angle (S-N-B)
    const B = getLandmark('B');
    if (S && N && B) {
      const angle = calculateAngle(S, N, B);
      measurements.push({
        name: 'SNB',
        value: angle,
        normal: '80° ± 2°',
        unit: '°'
      });
    }
    
    // ANB Angle
    if (S && N && A && B) {
      const sna = calculateAngle(S, N, A);
      const snb = calculateAngle(S, N, B);
      measurements.push({
        name: 'ANB',
        value: sna - snb,
        normal: '2° ± 2°',
        unit: '°'
      });
    }
    
    // Frankfort Horizontal to Mandibular Plane
    const Po = getLandmark('Po');
    const Or = getLandmark('Or');
    const Go = getLandmark('Go');
    const Me = getLandmark('Me');
    
    if (Po && Or && Go && Me) {
      // Calculate FMA (Frankfort-Mandibular Angle)
      const fh = Math.atan2(Or.y - Po.y, Or.x - Po.x);
      const mp = Math.atan2(Me.y - Go.y, Me.x - Go.x);
      const fma = Math.abs((fh - mp) * 180 / Math.PI);
      measurements.push({
        name: 'FMA',
        value: fma,
        normal: '25° ± 5°',
        unit: '°'
      });
    }
    
    return measurements;
  }, [landmarks]);

  const calculateAngle = (p1: LandmarkPoint, vertex: LandmarkPoint, p2: LandmarkPoint) => {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const cos = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      // Load image to canvas
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.src = url;
      
      // Upload to storage if patient context
      if (patientId) {
        const fileName = `${patientId}/ceph/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(fileName, file);

        if (!uploadError) {
          // Store only the storage path (bucket is private). Signed URLs are generated on-demand when viewing.
          await supabase.from('patient_documents').insert({
            patient_id: patientId,
            file_name: file.name,
            file_url: fileName,
            document_type: 'cephalometric',
            mime_type: file.type,
            file_size: file.size,
          });

          queryClient.invalidateQueries({ queryKey: ['ceph-images', patientId] });
        }
      }
      
      toast({ title: "Imagen cargada", description: file.name });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la imagen", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'place' || !selectedLandmark) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / (zoom / 100);
    const y = (e.clientY - rect.top - panOffset.y) / (zoom / 100);
    
    // Check if landmark already placed
    const existing = landmarks.find(l => l.landmarkId === selectedLandmark);
    if (existing) {
      setLandmarks(prev => prev.map(l => 
        l.landmarkId === selectedLandmark ? { ...l, x, y } : l
      ));
    } else {
      setLandmarks(prev => [...prev, {
        id: `lm-${Date.now()}`,
        landmarkId: selectedLandmark,
        x,
        y,
        visible: true
      }]);
    }
    
    // Auto-select next landmark
    const currentIndex = CEPHALOMETRIC_LANDMARKS.findIndex(l => l.id === selectedLandmark);
    if (currentIndex < CEPHALOMETRIC_LANDMARKS.length - 1) {
      setSelectedLandmark(CEPHALOMETRIC_LANDMARKS[currentIndex + 1].id);
    }
  };

  const removeLandmark = (landmarkId: string) => {
    setLandmarks(prev => prev.filter(l => l.landmarkId !== landmarkId));
  };

  const measurements = calculateMeasurements();

  const tools = [
    { id: 'select' as const, icon: Move, label: 'Seleccionar' },
    { id: 'place' as const, icon: Target, label: 'Colocar Punto' },
    { id: 'measure' as const, icon: Ruler, label: 'Medir' },
  ];

  return (
    <Card className={isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Análisis Cefalométrico
            {patientName && <Badge variant="secondary">{patientName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de análisis" />
              </SelectTrigger>
              <SelectContent>
                {CEPH_ANALYSES.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}>
          {/* Left Sidebar - Landmarks */}
          <div className="w-64 border-r flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm mb-2">Herramientas</h3>
              <div className="flex gap-1">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={activeTool === tool.id ? "default" : "ghost"}
                      size="icon"
                      className="flex-1"
                      onClick={() => setActiveTool(tool.id)}
                      title={tool.label}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3">
                <h4 className="text-sm font-medium mb-2">Puntos Cefalométricos</h4>
                <div className="space-y-1">
                  {CEPHALOMETRIC_LANDMARKS.map((landmark) => {
                    const placed = landmarks.find(l => l.landmarkId === landmark.id);
                    const isSelected = selectedLandmark === landmark.id;
                    
                    return (
                      <div
                        key={landmark.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary'
                        }`}
                        onClick={() => {
                          setSelectedLandmark(landmark.id);
                          setActiveTool('place');
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: landmark.color }}
                        >
                          {placed && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-xs">{landmark.id}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {landmark.name}
                            </span>
                          </div>
                        </div>
                        {placed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLandmark(landmark.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Colocados: {landmarks.length} / {CEPHALOMETRIC_LANDMARKS.length}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(landmarks.length / CEPHALOMETRIC_LANDMARKS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Main Viewer */}
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="p-2 border-b flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="text-sm">Cargar Radiografía</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <span className="text-xs">Zoom:</span>
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={50}
                  max={200}
                  step={10}
                  className="w-24"
                />
                <span className="text-xs w-10">{zoom}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs">Brillo:</span>
                <Slider
                  value={[brightness]}
                  onValueChange={([v]) => setBrightness(v)}
                  min={50}
                  max={150}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs">Contraste:</span>
                <Slider
                  value={[contrast]}
                  onValueChange={([v]) => setContrast(v)}
                  min={50}
                  max={150}
                  className="w-20"
                />
              </div>
            </div>
            
            {/* Image Viewer */}
            <div 
              ref={containerRef}
              className="flex-1 bg-black overflow-hidden relative"
              onClick={handleCanvasClick}
              style={{ cursor: activeTool === 'place' ? 'crosshair' : 'default' }}
            >
              {imageUrl ? (
                <div
                  className="absolute"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`
                  }}
                >
                  <canvas ref={canvasRef} />
                  
                  {/* Render landmarks */}
                  <svg className="absolute inset-0 pointer-events-none overflow-visible">
                    {landmarks.filter(l => l.visible).map((lm) => {
                      const def = CEPHALOMETRIC_LANDMARKS.find(d => d.id === lm.landmarkId);
                      if (!def) return null;
                      
                      return (
                        <g key={lm.id}>
                          <circle
                            cx={lm.x}
                            cy={lm.y}
                            r="6"
                            fill={def.color}
                            stroke="white"
                            strokeWidth="2"
                          />
                          <text
                            x={lm.x + 10}
                            y={lm.y + 4}
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                            style={{ textShadow: '0 0 3px black' }}
                          >
                            {def.id}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Draw connecting lines for placed landmarks */}
                    {landmarks.length >= 2 && (
                      <>
                        {/* SN Line */}
                        {landmarks.find(l => l.landmarkId === 'S') && landmarks.find(l => l.landmarkId === 'N') && (
                          <line
                            x1={landmarks.find(l => l.landmarkId === 'S')!.x}
                            y1={landmarks.find(l => l.landmarkId === 'S')!.y}
                            x2={landmarks.find(l => l.landmarkId === 'N')!.x}
                            y2={landmarks.find(l => l.landmarkId === 'N')!.y}
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                        )}
                        {/* NA Line */}
                        {landmarks.find(l => l.landmarkId === 'N') && landmarks.find(l => l.landmarkId === 'A') && (
                          <line
                            x1={landmarks.find(l => l.landmarkId === 'N')!.x}
                            y1={landmarks.find(l => l.landmarkId === 'N')!.y}
                            x2={landmarks.find(l => l.landmarkId === 'A')!.x}
                            y2={landmarks.find(l => l.landmarkId === 'A')!.y}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                        )}
                        {/* NB Line */}
                        {landmarks.find(l => l.landmarkId === 'N') && landmarks.find(l => l.landmarkId === 'B') && (
                          <line
                            x1={landmarks.find(l => l.landmarkId === 'N')!.x}
                            y1={landmarks.find(l => l.landmarkId === 'N')!.y}
                            x2={landmarks.find(l => l.landmarkId === 'B')!.x}
                            y2={landmarks.find(l => l.landmarkId === 'B')!.y}
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                        )}
                      </>
                    )}
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/40">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>Carga una radiografía cefalométrica</p>
                    <p className="text-sm">para comenzar el análisis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - Measurements */}
          <div className="w-72 border-l flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Mediciones</h3>
              <p className="text-xs text-muted-foreground">
                Análisis: {CEPH_ANALYSES.find(a => a.id === analysisType)?.name}
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {measurements.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Coloca los puntos cefalométricos para ver las mediciones
                  </p>
                ) : (
                  measurements.map((m, i) => (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-secondary/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{m.name}</span>
                        <span className="text-lg font-bold text-primary">
                          {m.value.toFixed(1)}{m.unit}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Normal: {m.normal}
                      </div>
                      <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            Math.abs(m.value - parseFloat(m.normal)) <= 2 
                              ? 'bg-green-500' 
                              : Math.abs(m.value - parseFloat(m.normal)) <= 4
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (m.value / 100) * 100)}%` }}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t space-y-2">
              <Button className="w-full gap-2" disabled={measurements.length === 0}>
                <FileText className="w-4 h-4" />
                Generar Reporte
              </Button>
              <Button variant="outline" className="w-full gap-2" disabled={measurements.length === 0}>
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CephalometryModule;
