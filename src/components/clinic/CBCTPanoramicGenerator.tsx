import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Image,
  Settings2,
  Download,
  Upload,
  Loader2,
  RefreshCw,
  Layers,
  Eye,
  Save,
  Wand2,
  RotateCw,
  SunDim,
  Contrast,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CBCTPanoramicGeneratorProps {
  patientId: string;
  patientName: string;
}

interface VolumeData {
  width: number;
  height: number;
  depth: number;
  data: Float32Array;
  spacing: [number, number, number];
}

// Processing modes for panoramic generation
type ProjectionMode = 'mip' | 'average' | 'curved' | 'orthogonal';

export const CBCTPanoramicGenerator = ({ patientId, patientName }: CBCTPanoramicGeneratorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('mip');
  
  // Curve parameters for curved panoramic
  const [curveRadius, setCurveRadius] = useState(80);
  const [curveAngle, setCurveAngle] = useState(180);
  const [curveOffset, setCurveOffset] = useState(0);
  const [sliceThickness, setSliceThickness] = useState(10);
  
  // Display parameters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [windowLevel, setWindowLevel] = useState(500);
  const [windowWidth, setWindowWidth] = useState(2000);
  
  // Generated panoramic
  const [panoramicImage, setPanoramicImage] = useState<ImageData | null>(null);
  const [currentSlice, setCurrentSlice] = useState(50);

  // Maximum Intensity Projection along Y axis
  const generateMIP = useCallback((volume: VolumeData): ImageData => {
    const { width, height, depth, data } = volume;
    const outputWidth = width;
    const outputHeight = depth;
    const output = new ImageData(outputWidth, outputHeight);
    
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        
        // Find maximum along Y axis
        for (let y = 0; y < height; y++) {
          const idx = z * width * height + y * width + x;
          const val = data[idx] || 0;
          maxVal = Math.max(maxVal, val);
        }
        
        // Normalize to 0-255
        const normalized = Math.min(255, Math.max(0, maxVal * 255));
        const outIdx = (z * outputWidth + x) * 4;
        
        output.data[outIdx] = normalized;
        output.data[outIdx + 1] = normalized;
        output.data[outIdx + 2] = normalized;
        output.data[outIdx + 3] = 255;
      }
      
      setProgress(Math.round((z / depth) * 100));
    }
    
    return output;
  }, []);

  // Average Intensity Projection
  const generateAverageProjection = useCallback((volume: VolumeData): ImageData => {
    const { width, height, depth, data } = volume;
    const outputWidth = width;
    const outputHeight = depth;
    const output = new ImageData(outputWidth, outputHeight);
    
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        // Average along Y axis
        for (let y = 0; y < height; y++) {
          const idx = z * width * height + y * width + x;
          const val = data[idx] || 0;
          if (val > 0.1) { // Only count non-background
            sum += val;
            count++;
          }
        }
        
        const avgVal = count > 0 ? sum / count : 0;
        const normalized = Math.min(255, Math.max(0, avgVal * 255));
        const outIdx = (z * outputWidth + x) * 4;
        
        output.data[outIdx] = normalized;
        output.data[outIdx + 1] = normalized;
        output.data[outIdx + 2] = normalized;
        output.data[outIdx + 3] = 255;
      }
      
      setProgress(Math.round((z / depth) * 100));
    }
    
    return output;
  }, []);

  // Curved Panoramic - simulates dental arch curve
  const generateCurvedPanoramic = useCallback((volume: VolumeData): ImageData => {
    const { width, height, depth, data } = volume;
    
    // Output size for panoramic
    const panoramicWidth = Math.round(curveAngle * 4); // ~4 pixels per degree
    const panoramicHeight = depth;
    const output = new ImageData(panoramicWidth, panoramicHeight);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusPixels = curveRadius * (width / 200); // Scale radius
    
    for (let z = 0; z < depth; z++) {
      for (let px = 0; px < panoramicWidth; px++) {
        // Calculate angle for this panoramic column
        const angle = ((px / panoramicWidth) * curveAngle - curveAngle / 2) * (Math.PI / 180);
        
        // Sample along the curve
        let maxVal = 0;
        
        for (let r = -sliceThickness / 2; r <= sliceThickness / 2; r++) {
          const sampleRadius = radiusPixels + r + curveOffset;
          const x = Math.round(centerX + sampleRadius * Math.sin(angle));
          const y = Math.round(centerY + sampleRadius * Math.cos(angle));
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = z * width * height + y * width + x;
            const val = data[idx] || 0;
            maxVal = Math.max(maxVal, val);
          }
        }
        
        const normalized = Math.min(255, Math.max(0, maxVal * 255));
        const outIdx = (z * panoramicWidth + px) * 4;
        
        output.data[outIdx] = normalized;
        output.data[outIdx + 1] = normalized;
        output.data[outIdx + 2] = normalized;
        output.data[outIdx + 3] = 255;
      }
      
      setProgress(Math.round((z / depth) * 100));
    }
    
    return output;
  }, [curveRadius, curveAngle, curveOffset, sliceThickness]);

  // Orthogonal slice view
  const generateOrthogonalSlice = useCallback((volume: VolumeData, sliceIndex: number): ImageData => {
    const { width, height, depth, data } = volume;
    const output = new ImageData(width, height);
    
    const z = Math.min(Math.max(0, sliceIndex), depth - 1);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = z * width * height + y * width + x;
        const val = data[idx] || 0;
        const normalized = Math.min(255, Math.max(0, val * 255));
        const outIdx = (y * width + x) * 4;
        
        output.data[outIdx] = normalized;
        output.data[outIdx + 1] = normalized;
        output.data[outIdx + 2] = normalized;
        output.data[outIdx + 3] = 255;
      }
    }
    
    return output;
  }, []);

  // Process uploaded CBCT data (simulated from image stack or DICOM)
  const processUploadedFiles = async (files: FileList) => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      const imageFiles = Array.from(files)
        .filter(f => f.type.startsWith('image/') || f.name.endsWith('.dcm'))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      if (imageFiles.length === 0) {
        toast({ title: "Error", description: "No se encontraron imágenes válidas", variant: "destructive" });
        return;
      }
      
      // Load first image to get dimensions
      const firstImage = await loadImageFile(imageFiles[0]);
      const width = firstImage.width;
      const height = firstImage.height;
      const depth = imageFiles.length;
      
      // Create volume data array
      const volumeArray = new Float32Array(width * height * depth);
      
      // Load all slices
      for (let z = 0; z < imageFiles.length; z++) {
        const img = await loadImageFile(imageFiles[z]);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = z * width * height + y * width + x;
            // Convert to grayscale normalized 0-1
            const gray = (imgData.data[srcIdx] + imgData.data[srcIdx + 1] + imgData.data[srcIdx + 2]) / (3 * 255);
            volumeArray[dstIdx] = gray;
          }
        }
        
        setProgress(Math.round((z / depth) * 50));
      }
      
      const volume: VolumeData = {
        width,
        height,
        depth,
        data: volumeArray,
        spacing: [1, 1, 1]
      };
      
      setVolumeData(volume);
      toast({ title: "CBCT Cargado", description: `${depth} cortes de ${width}x${height} cargados` });
      
      // Generate initial panoramic
      await generatePanoramic(volume);
      
    } catch (error) {
      console.error('Error processing files:', error);
      toast({ title: "Error", description: "No se pudieron procesar los archivos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadImageFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Generate panoramic based on current mode
  const generatePanoramic = useCallback(async (volume?: VolumeData) => {
    const vol = volume || volumeData;
    if (!vol) return;
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI update
      
      let result: ImageData;
      
      switch (projectionMode) {
        case 'mip':
          result = generateMIP(vol);
          break;
        case 'average':
          result = generateAverageProjection(vol);
          break;
        case 'curved':
          result = generateCurvedPanoramic(vol);
          break;
        case 'orthogonal':
          result = generateOrthogonalSlice(vol, Math.round((currentSlice / 100) * vol.depth));
          break;
        default:
          result = generateMIP(vol);
      }
      
      setPanoramicImage(result);
      renderToCanvas(result);
      
    } catch (error) {
      console.error('Error generating panoramic:', error);
      toast({ title: "Error", description: "Error al generar panorámica", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  }, [volumeData, projectionMode, currentSlice, generateMIP, generateAverageProjection, generateCurvedPanoramic, generateOrthogonalSlice, toast]);

  // Apply window level and render to canvas
  const renderToCanvas = useCallback((imageData: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    
    // Apply window level/width transformation
    const processed = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    const windowMin = windowLevel - windowWidth / 2;
    const windowMax = windowLevel + windowWidth / 2;
    const brightFactor = brightness / 100;
    const contrastFactor = contrast / 100;
    
    for (let i = 0; i < processed.data.length; i += 4) {
      let val = processed.data[i];
      
      // Window level
      val = ((val / 255) * 2000 - windowMin) / windowWidth * 255;
      
      // Brightness & Contrast
      val = ((val - 128) * contrastFactor + 128) * brightFactor;
      
      val = Math.min(255, Math.max(0, val));
      
      processed.data[i] = val;
      processed.data[i + 1] = val;
      processed.data[i + 2] = val;
    }
    
    ctx.putImageData(processed, 0, 0);
  }, [brightness, contrast, windowLevel, windowWidth]);

  // Re-render when display parameters change
  useEffect(() => {
    if (panoramicImage) {
      renderToCanvas(panoramicImage);
    }
  }, [panoramicImage, brightness, contrast, windowLevel, windowWidth, renderToCanvas]);

  // Re-generate when projection parameters change
  useEffect(() => {
    if (volumeData) {
      generatePanoramic();
    }
  }, [projectionMode, curveRadius, curveAngle, curveOffset, sliceThickness, currentSlice]);

  // Save panoramic to storage
  const saveMutation = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("No canvas");
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Failed to create blob")), 'image/png');
      });
      
      const fileName = `${patientId}/panoramic-${Date.now()}.png`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('patient-files')
        .getPublicUrl(fileName);
      
      // Save document record
      const { error: docError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          file_name: `Panorámica generada - ${new Date().toLocaleDateString()}`,
          file_url: urlData.publicUrl,
          document_type: 'xray',
          mime_type: 'image/png',
          description: `Panorámica ${projectionMode.toUpperCase()} generada desde CBCT`
        });
      
      if (docError) throw docError;
      
      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dicom-studies', patientId] });
      toast({ title: "Guardado", description: "Panorámica guardada en el expediente del paciente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la imagen", variant: "destructive" });
    }
  });

  const downloadPanoramic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `panoramica-${patientName.replace(/\s+/g, '_')}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  const projectionModes = [
    { value: 'mip', label: 'MIP (Máxima Intensidad)', icon: Layers },
    { value: 'average', label: 'Proyección Promedio', icon: Image },
    { value: 'curved', label: 'Panorámica Curva', icon: Wand2 },
    { value: 'orthogonal', label: 'Corte Ortogonal', icon: Box }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Controls Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Generador Panorámico
          </CardTitle>
          <Badge variant="secondary" className="w-fit">{patientName}</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload */}
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
            <span className="text-sm text-center text-muted-foreground">
              {isLoading ? 'Procesando...' : 'Cargar CBCT (múltiples imágenes)'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
          
          {isLoading && (
            <Progress value={progress} className="h-2" />
          )}

          {/* Projection Mode */}
          <div className="space-y-2">
            <Label>Modo de Proyección</Label>
            <Select value={projectionMode} onValueChange={(v: ProjectionMode) => setProjectionMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectionModes.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      <mode.icon className="w-4 h-4" />
                      {mode.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Curved Panoramic Controls */}
          {projectionMode === 'curved' && (
            <div className="space-y-4 p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium">Parámetros de Curva</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Radio</span>
                  <span>{curveRadius}%</span>
                </div>
                <Slider
                  value={[curveRadius]}
                  onValueChange={([v]) => setCurveRadius(v)}
                  min={40}
                  max={120}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ángulo</span>
                  <span>{curveAngle}°</span>
                </div>
                <Slider
                  value={[curveAngle]}
                  onValueChange={([v]) => setCurveAngle(v)}
                  min={90}
                  max={270}
                  step={10}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Offset</span>
                  <span>{curveOffset}</span>
                </div>
                <Slider
                  value={[curveOffset]}
                  onValueChange={([v]) => setCurveOffset(v)}
                  min={-50}
                  max={50}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Grosor</span>
                  <span>{sliceThickness}mm</span>
                </div>
                <Slider
                  value={[sliceThickness]}
                  onValueChange={([v]) => setSliceThickness(v)}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
            </div>
          )}

          {/* Orthogonal Slice Control */}
          {projectionMode === 'orthogonal' && volumeData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Corte</span>
                <span>{currentSlice}%</span>
              </div>
              <Slider
                value={[currentSlice]}
                onValueChange={([v]) => setCurrentSlice(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          )}

          {/* Display Controls */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Visualización</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <SunDim className="w-4 h-4" />
                  <span>Brillo</span>
                </div>
                <span>{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={50}
                max={200}
                step={5}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  <span>Contraste</span>
                </div>
                <span>{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([v]) => setContrast(v)}
                min={50}
                max={200}
                step={5}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Window Level</span>
                <span>{windowLevel}</span>
              </div>
              <Slider
                value={[windowLevel]}
                onValueChange={([v]) => setWindowLevel(v)}
                min={0}
                max={2000}
                step={50}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Window Width</span>
                <span>{windowWidth}</span>
              </div>
              <Slider
                value={[windowWidth]}
                onValueChange={([v]) => setWindowWidth(v)}
                min={200}
                max={4000}
                step={100}
              />
            </div>
          </div>

          {/* Actions */}
          {panoramicImage && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => generatePanoramic()} disabled={isLoading} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Regenerar
              </Button>
              <Button onClick={downloadPanoramic} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Descargar PNG
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                variant="outline" 
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar en Expediente
              </Button>
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
              Vista Previa Panorámica
              {volumeData && (
                <Badge variant="secondary">
                  {volumeData.width}×{volumeData.height}×{volumeData.depth}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(25, z - 25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="relative bg-black rounded-xl overflow-auto"
            style={{ height: '500px' }}
          >
            {panoramicImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center center',
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <div className="text-center">
                  <Layers className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg mb-2">Generador de Panorámicas CBCT</p>
                  <p className="text-sm">
                    Carga un estudio CBCT (múltiples imágenes de cortes axiales) para generar una vista panorámica
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Info Bar */}
          {volumeData && (
            <div className="grid grid-cols-4 gap-4 p-4 mt-4 bg-secondary/30 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground">Modo</p>
                <p className="font-medium">{projectionModes.find(m => m.value === projectionMode)?.label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dimensiones</p>
                <p className="font-medium">{volumeData.width}×{volumeData.height}×{volumeData.depth}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Window L/W</p>
                <p className="font-medium">{windowLevel} / {windowWidth}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zoom</p>
                <p className="font-medium">{zoom}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
