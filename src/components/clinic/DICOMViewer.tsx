import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Contrast,
  SunDim,
  Maximize2,
  Download,
  Upload,
  Layers,
  Ruler,
  RefreshCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Eye,
  ImageIcon,
  FileX,
  Trash2,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DICOMViewerProps {
  patientId?: string;
  patientName?: string;
}

interface DicomStudy {
  id: string;
  name: string;
  file_url: string;
  file_name: string;
  created_at: string;
  type: 'panoramic' | 'periapical' | 'cbct' | 'cephalometric' | 'bitewing';
  slices?: number;
}

export const DICOMViewer = ({ patientId, patientName }: DICOMViewerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStudy, setCurrentStudy] = useState<DicomStudy | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'pan' | 'zoom' | 'measure' | 'window'>('pan');
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [measurements, setMeasurements] = useState<Array<{ 
    start: { x: number; y: number }; 
    end: { x: number; y: number }; 
    value: number 
  }>>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);

  // Fetch studies from Cloud storage
  const { data: studies = [], isLoading: loadingStudies } = useQuery({
    queryKey: ['dicom-studies', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      // Get documents of type 'xray' or 'dicom'
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .in('document_type', ['xray', 'dicom', 'radiograph'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((doc: any) => ({
        id: doc.id,
        name: doc.description || doc.file_name,
        file_url: doc.file_url,
        file_name: doc.file_name,
        created_at: doc.created_at,
        type: detectStudyType(doc.file_name) as DicomStudy['type'],
        slices: doc.mime_type?.includes('cbct') ? 100 : undefined
      }));
    },
    enabled: !!patientId
  });

  const detectStudyType = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('pano')) return 'panoramic';
    if (lower.includes('cbct') || lower.includes('3d')) return 'cbct';
    if (lower.includes('cef') || lower.includes('ceph')) return 'cephalometric';
    if (lower.includes('bite') || lower.includes('bw')) return 'bitewing';
    return 'periapical';
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!patientId) throw new Error("Patient ID required");

      const fileName = `${patientId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store only the storage path (bucket is private). Signed URLs are generated on-demand when viewing.
      const { error: docError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          file_name: file.name,
          file_url: fileName,
          document_type: 'xray',
          mime_type: file.type,
          file_size: file.size,
          description: file.name.replace(/\.[^/.]+$/, '')
        });

      if (docError) throw docError;

      return fileName;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dicom-studies', patientId] });
      toast({ title: "Imagen cargada", description: "El estudio se ha guardado correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo cargar la imagen", variant: "destructive" });
    }
  });

  // Auto-play slices for CBCT
  useEffect(() => {
    if (!isPlaying || totalSlices <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlice((prev) => (prev + 1) % totalSlices);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, totalSlices]);

  // Load and render image
  const loadImage = useCallback(async (study: DicomStudy) => {
    setCurrentStudy(study);

    if (study.slices) {
      setTotalSlices(study.slices);
      setCurrentSlice(0);
    } else {
      setTotalSlices(1);
      setCurrentSlice(0);
    }

    // Resolve private storage paths to signed URLs
    const resolvedUrl = (study.file_url.startsWith('http://') || study.file_url.startsWith('https://'))
      ? study.file_url
      : await getSignedUrl('patient-files', study.file_url);

    if (!resolvedUrl) {
      toast({ title: "Error", description: "No se pudo generar el acceso al archivo", variant: "destructive" });
      return;
    }

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Store image data for manipulation
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => {
      toast({ title: "Error", description: "No se pudo cargar la imagen", variant: "destructive" });
    };
    img.src = resolvedUrl;

    resetView();
  }, [toast]);

  // Apply filters to canvas
  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a copy of image data
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    // Apply brightness and contrast
    const brightnessVal = brightness / 100;
    const contrastVal = (contrast / 100 - 1) * 255;
    
    for (let i = 0; i < newImageData.data.length; i += 4) {
      // Apply brightness
      newImageData.data[i] = newImageData.data[i] * brightnessVal;
      newImageData.data[i + 1] = newImageData.data[i + 1] * brightnessVal;
      newImageData.data[i + 2] = newImageData.data[i + 2] * brightnessVal;
      
      // Apply contrast
      newImageData.data[i] = Math.max(0, Math.min(255, ((newImageData.data[i] - 128) * (contrast / 100) + 128)));
      newImageData.data[i + 1] = Math.max(0, Math.min(255, ((newImageData.data[i + 1] - 128) * (contrast / 100) + 128)));
      newImageData.data[i + 2] = Math.max(0, Math.min(255, ((newImageData.data[i + 2] - 128) * (contrast / 100) + 128)));
    }
    
    ctx.putImageData(newImageData, 0, 0);
  }, [brightness, contrast, imageData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom', 'image/tiff'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
        toast({
          title: "Archivo no soportado",
          description: `${file.name} no es un formato válido`,
          variant: "destructive"
        });
        continue;
      }
      
      await uploadMutation.mutateAsync(file);
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetView = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setMeasurements([]);
  };

  // Mouse handlers for pan and measure
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (selectedTool === 'measure') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / (zoom / 100);
      const y = (e.clientY - rect.top) / (zoom / 100);
      setMeasureStart({ x, y });
      setIsMeasuring(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && selectedTool === 'pan') {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isMeasuring && measureStart) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / (zoom / 100);
      const y = (e.clientY - rect.top) / (zoom / 100);
      
      // Calculate distance (assuming 0.1mm per pixel for demo)
      const distance = Math.sqrt(Math.pow(x - measureStart.x, 2) + Math.pow(y - measureStart.y, 2)) * 0.1;
      
      setMeasurements([...measurements, {
        start: measureStart,
        end: { x, y },
        value: distance
      }]);
      setIsMeasuring(false);
      setMeasureStart(null);
    }
  };

  const tools = [
    { id: 'pan', icon: Move, label: 'Mover' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
    { id: 'window', icon: Contrast, label: 'Ventana' },
    { id: 'measure', icon: Ruler, label: 'Medir' }
  ];

  const getTypeColor = (type: DicomStudy['type']) => {
    const colors = {
      panoramic: 'bg-blue-500/10 text-blue-600',
      periapical: 'bg-green-500/10 text-green-600',
      cbct: 'bg-purple-500/10 text-purple-600',
      cephalometric: 'bg-amber-500/10 text-amber-600',
      bitewing: 'bg-cyan-500/10 text-cyan-600'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-600';
  };

  const getTypeLabel = (type: DicomStudy['type']) => {
    const labels = {
      panoramic: 'Panorámica',
      periapical: 'Periapical',
      cbct: 'CBCT',
      cephalometric: 'Cefalométrica',
      bitewing: 'Bite-wing'
    };
    return labels[type] || type;
  };

  const ViewerContent = () => (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden"
      style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setIsPanning(false); setIsMeasuring(false); }}
    >
      {currentStudy ? (
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            cursor: selectedTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 
                   selectedTool === 'measure' ? 'crosshair' : 'default'
          }}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-full"
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30">
          <div className="text-center">
            <FileX className="w-16 h-16 mx-auto mb-4" />
            <p>Selecciona o carga un estudio</p>
          </div>
        </div>
      )}

      {/* Measurement overlays */}
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {measurements.map((m, i) => {
          const scale = zoom / 100;
          const x1 = m.start.x * scale + panOffset.x;
          const y1 = m.start.y * scale + panOffset.y;
          const x2 = m.end.x * scale + panOffset.x;
          const y2 = m.end.y * scale + panOffset.y;
          
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ff00" strokeWidth="2" />
              <circle cx={x1} cy={y1} r="4" fill="#00ff00" />
              <circle cx={x2} cy={y2} r="4" fill="#00ff00" />
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 10}
                fill="#00ff00"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.value.toFixed(1)} mm
              </text>
            </g>
          );
        })}
      </svg>

      {/* CBCT Slice Controls */}
      {currentStudy?.type === 'cbct' && totalSlices > 1 && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 rounded-xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentSlice(0)} className="text-white">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)} className="text-white">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentSlice(totalSlices - 1)} className="text-white">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Slider
              value={[currentSlice]}
              onValueChange={([v]) => setCurrentSlice(v)}
              min={0}
              max={totalSlices - 1}
              step={1}
              className="flex-1"
            />
            <span className="text-white text-sm min-w-[80px] text-right">
              {currentSlice + 1} / {totalSlices}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Study List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Estudios
            {patientName && <Badge variant="secondary" className="text-xs">{patientName}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Upload className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Subiendo...' : 'Cargar Imagen'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>

          {/* Study List */}
          {loadingStudies ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : studies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay estudios guardados
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {studies.map((study) => (
                <motion.div
                  key={study.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    currentStudy?.id === study.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                  onClick={() => loadImage(study)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{study.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(study.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className={getTypeColor(study.type)}>
                      {getTypeLabel(study.type)}
                    </Badge>
                    {study.slices && (
                      <Badge variant="outline" className="text-xs">
                        {study.slices} cortes
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viewer */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visor de Imágenes
              {currentStudy && <Badge variant="secondary">{currentStudy.name}</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetView}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              {currentStudy && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(currentStudy.file_url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-4 p-2 bg-secondary/50 rounded-xl flex-wrap">
            {/* Tools */}
            <div className="flex items-center gap-1 p-1 bg-background rounded-lg">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool(tool.id as any)}
                  title={tool.label}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Rotation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(25, z - 25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(400, z + 25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Brightness */}
            <div className="flex items-center gap-2">
              <SunDim className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={0}
                max={200}
                step={5}
                className="w-20"
              />
            </div>

            {/* Contrast */}
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[contrast]}
                onValueChange={([v]) => setContrast(v)}
                min={0}
                max={200}
                step={5}
                className="w-20"
              />
            </div>
            
            {measurements.length > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMeasurements([])}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpiar mediciones
                </Button>
              </>
            )}
          </div>

          {/* Viewer Area */}
          <ViewerContent />

          {/* Image Info */}
          {currentStudy && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{getTypeLabel(currentStudy.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{new Date(currentStudy.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zoom</p>
                <p className="font-medium">{zoom}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rotación</p>
                <p className="font-medium">{rotation}°</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh] p-4">
          <DialogHeader>
            <DialogTitle>{currentStudy?.name || 'Visor de Imágenes'}</DialogTitle>
          </DialogHeader>
          <ViewerContent />
        </DialogContent>
      </Dialog>
    </div>
  );
};
