import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ZoomIn, ZoomOut, RotateCw, Move, Contrast, Maximize2, 
  Upload, Ruler, RefreshCw, Loader2, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface DICOMViewportProps {
  viewportType: 'axial' | 'coronal' | 'sagittal';
  isActive: boolean;
  onActivate: () => void;
  onFullscreen: () => void;
  showCrosshair: boolean;
  zoom: number;
  imageUrl?: string;
  sliceIndex?: number;
  totalSlices?: number;
  onSliceChange?: (index: number) => void;
}

export const DICOMViewport = ({
  viewportType,
  isActive,
  onActivate,
  onFullscreen,
  showCrosshair,
  zoom: initialZoom,
  imageUrl,
  sliceIndex = 0,
  totalSlices = 1,
  onSliceChange
}: DICOMViewportProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [zoom, setZoom] = useState(initialZoom || 100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<'pan' | 'zoom' | 'measure' | 'window'>('pan');
  const [measurements, setMeasurements] = useState<Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    value: number;
  }>>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);

  const viewportLabels = {
    axial: 'Axial',
    coronal: 'Coronal',
    sagittal: 'Sagital'
  };

  const viewportColors = {
    axial: 'border-blue-500',
    coronal: 'border-green-500',
    sagittal: 'border-orange-500'
  };

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl && imageUrl !== loadedImageUrl) {
      loadImage(imageUrl);
    }
  }, [imageUrl]);

  const loadImage = useCallback((url: string) => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      setLoadedImageUrl(url);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = url;
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
      return;
    }
    
    const url = URL.createObjectURL(file);
    loadImage(url);
  };

  // Apply brightness/contrast
  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    for (let i = 0; i < newImageData.data.length; i += 4) {
      // Apply brightness
      newImageData.data[i] = newImageData.data[i] * (brightness / 100);
      newImageData.data[i + 1] = newImageData.data[i + 1] * (brightness / 100);
      newImageData.data[i + 2] = newImageData.data[i + 2] * (brightness / 100);
      
      // Apply contrast
      newImageData.data[i] = Math.max(0, Math.min(255, ((newImageData.data[i] - 128) * (contrast / 100) + 128)));
      newImageData.data[i + 1] = Math.max(0, Math.min(255, ((newImageData.data[i + 1] - 128) * (contrast / 100) + 128)));
      newImageData.data[i + 2] = Math.max(0, Math.min(255, ((newImageData.data[i + 2] - 128) * (contrast / 100) + 128)));
    }
    
    ctx.putImageData(newImageData, 0, 0);
  }, [brightness, contrast, imageData]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    onActivate();
    
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (selectedTool === 'zoom' || e.ctrlKey) {
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(Math.max(25, Math.min(400, zoom + delta)));
    } else if (totalSlices > 1 && onSliceChange) {
      const delta = e.deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(totalSlices - 1, sliceIndex + delta));
      onSliceChange(newIndex);
    }
  };

  const resetView = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setMeasurements([]);
  };

  const tools = [
    { id: 'pan', icon: Move, label: 'Mover' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
    { id: 'window', icon: Contrast, label: 'Ventana' },
    { id: 'measure', icon: Ruler, label: 'Medir' }
  ];

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden border-2 transition-colors h-full",
        isActive ? viewportColors[viewportType] : "border-transparent"
      )}
      onClick={onActivate}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/80 to-transparent">
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded",
          viewportType === 'axial' && "bg-blue-500/30 text-blue-300",
          viewportType === 'coronal' && "bg-green-500/30 text-green-300",
          viewportType === 'sagittal' && "bg-orange-500/30 text-orange-300"
        )}>
          {viewportLabels[viewportType]}
        </span>
        
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/60">{zoom}%</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Mini Toolbar */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-7 left-1 z-10 flex flex-col gap-0.5 bg-black/60 rounded p-0.5"
        >
          {tools.map(tool => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 text-white/60 hover:text-white hover:bg-white/10",
                selectedTool === tool.id && "bg-white/20 text-white"
              )}
              onClick={(e) => { e.stopPropagation(); setSelectedTool(tool.id as any); }}
            >
              <tool.icon className="w-3 h-3" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); resetView(); }}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </motion.div>
      )}

      {/* Window/Level Controls */}
      {isActive && selectedTool === 'window' && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-7 right-1 z-10 bg-black/80 rounded p-2 space-y-2 w-24"
        >
          <div>
            <span className="text-[9px] text-white/60">Brillo</span>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={0}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
          <div>
            <span className="text-[9px] text-white/60">Contraste</span>
            <Slider
              value={[contrast]}
              onValueChange={([v]) => setContrast(v)}
              min={0}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </motion.div>
      )}

      {/* Canvas Area */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          cursor: selectedTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 
                 selectedTool === 'measure' ? 'crosshair' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsPanning(false); setIsMeasuring(false); }}
        onWheel={handleWheel}
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
        ) : loadedImageUrl || imageUrl ? (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <canvas ref={canvasRef} className="max-w-full max-h-full" />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center text-white/30 cursor-pointer hover:text-white/50 transition-colors">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-xs">Cargar imagen</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>

      {/* Crosshairs */}
      {showCrosshair && loadedImageUrl && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/50" />
        </div>
      )}

      {/* Measurements Overlay */}
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {measurements.map((m, i) => {
          const scale = zoom / 100;
          const x1 = m.start.x * scale + panOffset.x + (containerRef.current?.offsetWidth || 0) / 2;
          const y1 = m.start.y * scale + panOffset.y + (containerRef.current?.offsetHeight || 0) / 2;
          const x2 = m.end.x * scale + panOffset.x + (containerRef.current?.offsetWidth || 0) / 2;
          const y2 = m.end.y * scale + panOffset.y + (containerRef.current?.offsetHeight || 0) / 2;
          
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ff00" strokeWidth="2" />
              <circle cx={x1} cy={y1} r="3" fill="#00ff00" />
              <circle cx={x2} cy={y2} r="3" fill="#00ff00" />
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 8}
                fill="#00ff00"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.value.toFixed(1)} mm
              </text>
            </g>
          );
        })}
      </svg>

      {/* Slice indicator */}
      {totalSlices > 1 && (
        <div className="absolute bottom-1 left-1 right-1 z-10">
          <div className="flex items-center gap-2 bg-black/60 rounded p-1">
            <Slider
              value={[sliceIndex]}
              onValueChange={([v]) => onSliceChange?.(v)}
              min={0}
              max={totalSlices - 1}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] text-white/60 min-w-[40px] text-right">
              {sliceIndex + 1}/{totalSlices}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DICOMViewport;
