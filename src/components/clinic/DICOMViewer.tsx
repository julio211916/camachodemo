import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Grid3x3,
  Layers,
  Ruler,
  RefreshCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Eye,
  ImageIcon,
  FileX
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DICOMViewerProps {
  patientId?: string;
  patientName?: string;
}

interface DicomImage {
  id: string;
  name: string;
  date: string;
  type: 'panoramic' | 'periapical' | 'cbct' | 'cephalometric';
  slices?: number;
  thumbnail?: string;
}

export const DICOMViewer = ({ patientId, patientName }: DICOMViewerProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentImage, setCurrentImage] = useState<DicomImage | null>(null);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'pan' | 'zoom' | 'measure' | 'window'>('pan');
  const [measurements, setMeasurements] = useState<Array<{ start: { x: number; y: number }; end: { x: number; y: number }; value: number }>>([]);

  // Sample DICOM images
  const [dicomImages] = useState<DicomImage[]>([
    { id: '1', name: 'Panorámica', date: '2024-01-15', type: 'panoramic' },
    { id: '2', name: 'CBCT Maxilar', date: '2024-01-15', type: 'cbct', slices: 120 },
    { id: '3', name: 'Periapical 26', date: '2024-01-10', type: 'periapical' },
    { id: '4', name: 'Cefalométrica', date: '2024-01-05', type: 'cephalometric' }
  ]);

  // Auto-play slices for CBCT
  useEffect(() => {
    if (!isPlaying || totalSlices <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlice((prev) => (prev + 1) % totalSlices);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, totalSlices]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a DICOM file
    if (!file.name.endsWith('.dcm') && !file.name.endsWith('.DCM')) {
      toast({
        title: "Archivo no soportado",
        description: "Por favor suba un archivo DICOM (.dcm)",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, we would use cornerstone.js to parse DICOM
      // For now, we'll simulate loading
      toast({
        title: "Cargando DICOM",
        description: "Procesando archivo..."
      });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newImage: DicomImage = {
        id: Date.now().toString(),
        name: file.name.replace('.dcm', ''),
        date: new Date().toISOString().split('T')[0],
        type: 'periapical'
      };

      setCurrentImage(newImage);
      
      toast({
        title: "DICOM cargado",
        description: "El archivo ha sido procesado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo DICOM",
        variant: "destructive"
      });
    }
  };

  const loadImage = (image: DicomImage) => {
    setCurrentImage(image);
    if (image.type === 'cbct' && image.slices) {
      setTotalSlices(image.slices);
      setCurrentSlice(0);
    } else {
      setTotalSlices(1);
      setCurrentSlice(0);
    }
    resetView();
  };

  const resetView = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setMeasurements([]);
  };

  const tools = [
    { id: 'pan', icon: Move, label: 'Mover' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
    { id: 'window', icon: Contrast, label: 'Ventana' },
    { id: 'measure', icon: Ruler, label: 'Medir' }
  ];

  const getTypeColor = (type: DicomImage['type']) => {
    const colors = {
      panoramic: 'bg-blue-500/10 text-blue-600',
      periapical: 'bg-green-500/10 text-green-600',
      cbct: 'bg-purple-500/10 text-purple-600',
      cephalometric: 'bg-amber-500/10 text-amber-600'
    };
    return colors[type];
  };

  const getTypeLabel = (type: DicomImage['type']) => {
    const labels = {
      panoramic: 'Panorámica',
      periapical: 'Periapical',
      cbct: 'CBCT',
      cephalometric: 'Cefalométrica'
    };
    return labels[type];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Image List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Estudios DICOM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cargar DICOM</span>
            <input
              type="file"
              accept=".dcm,.DCM"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Image List */}
          <div className="space-y-2">
            {dicomImages.map((image) => (
              <motion.div
                key={image.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  currentImage?.id === image.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
                onClick={() => loadImage(image)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{image.name}</p>
                    <p className="text-xs text-muted-foreground">{image.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={getTypeColor(image.type)}>
                    {getTypeLabel(image.type)}
                  </Badge>
                  {image.slices && (
                    <Badge variant="outline" className="text-xs">
                      {image.slices} cortes
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Viewer */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visor DICOM
              {currentImage && (
                <Badge variant="secondary">{currentImage.name}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetView}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
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

            {/* Divider */}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.min(400, z + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Divider */}
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
          </div>

          {/* Viewer Area */}
          <div 
            className="relative bg-black rounded-xl overflow-hidden"
            style={{ height: '500px' }}
          >
            {currentImage ? (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`
                }}
              >
                {/* Placeholder for actual DICOM rendering */}
                <div className="text-center text-white/50">
                  <ImageIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{currentImage.name}</p>
                  <p className="text-sm">{getTypeLabel(currentImage.type)}</p>
                  {currentImage.type === 'cbct' && (
                    <p className="text-sm mt-2">
                      Corte {currentSlice + 1} de {totalSlices}
                    </p>
                  )}
                </div>

                {/* Measurement overlays would go here */}
                <svg className="absolute inset-0 pointer-events-none">
                  {measurements.map((m, i) => (
                    <g key={i}>
                      <line
                        x1={m.start.x}
                        y1={m.start.y}
                        x2={m.end.x}
                        y2={m.end.y}
                        stroke="#00ff00"
                        strokeWidth="2"
                      />
                      <text
                        x={(m.start.x + m.end.x) / 2}
                        y={(m.start.y + m.end.y) / 2 - 10}
                        fill="#00ff00"
                        fontSize="12"
                      >
                        {m.value.toFixed(1)} mm
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <div className="text-center">
                  <FileX className="w-16 h-16 mx-auto mb-4" />
                  <p>Selecciona o carga un estudio DICOM</p>
                </div>
              </div>
            )}

            {/* CBCT Slice Controls */}
            {currentImage?.type === 'cbct' && totalSlices > 1 && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 rounded-xl">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentSlice(0)}
                    className="text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentSlice(totalSlices - 1)}
                    className="text-white"
                  >
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

          {/* Image Info */}
          {currentImage && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{getTypeLabel(currentImage.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{currentImage.date}</p>
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
    </div>
  );
};
