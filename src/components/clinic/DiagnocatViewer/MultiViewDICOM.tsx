import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, FileImage, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { DICOMViewport } from "./DICOMViewport";

interface DICOMSlice {
  url: string;
  sliceIndex: number;
}

interface DICOMSeries {
  axial: DICOMSlice[];
  coronal: DICOMSlice[];
  sagittal: DICOMSlice[];
}

interface MultiViewDICOMProps {
  onClose?: () => void;
  patientId?: string;
}

export const MultiViewDICOM = ({ onClose, patientId }: MultiViewDICOMProps) => {
  const [series, setSeries] = useState<DICOMSeries>({
    axial: [],
    coronal: [],
    sagittal: []
  });
  const [activeViewport, setActiveViewport] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sliceIndices, setSliceIndices] = useState({ axial: 0, coronal: 0, sagittal: 0 });
  const [linkedViews, setLinkedViews] = useState(true);
  const [zoom, setZoom] = useState(100);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);

    try {
      // Group files by their naming convention or just treat as axial slices
      const axialSlices: DICOMSlice[] = [];
      const coronalSlices: DICOMSlice[] = [];
      const sagittalSlices: DICOMSlice[] = [];

      files.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const fileName = file.name.toLowerCase();
        
        // Determine view based on file name or distribute evenly
        if (fileName.includes('axial') || fileName.includes('ax')) {
          axialSlices.push({ url, sliceIndex: axialSlices.length });
        } else if (fileName.includes('coronal') || fileName.includes('cor')) {
          coronalSlices.push({ url, sliceIndex: coronalSlices.length });
        } else if (fileName.includes('sagittal') || fileName.includes('sag')) {
          sagittalSlices.push({ url, sliceIndex: sagittalSlices.length });
        } else {
          // Default: distribute to axial
          axialSlices.push({ url, sliceIndex: axialSlices.length });
        }
      });

      // If only axial images were loaded, generate pseudo views
      if (coronalSlices.length === 0 && axialSlices.length > 0) {
        // Use first image for all views as demo
        coronalSlices.push({ url: axialSlices[0]?.url || '', sliceIndex: 0 });
      }
      if (sagittalSlices.length === 0 && axialSlices.length > 0) {
        sagittalSlices.push({ url: axialSlices[0]?.url || '', sliceIndex: 0 });
      }

      setSeries({
        axial: axialSlices,
        coronal: coronalSlices,
        sagittal: sagittalSlices
      });

      setSliceIndices({
        axial: Math.floor(axialSlices.length / 2),
        coronal: Math.floor(coronalSlices.length / 2),
        sagittal: Math.floor(sagittalSlices.length / 2)
      });
    } catch (error) {
      console.error('Error loading DICOM files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSliceChange = useCallback((view: 'axial' | 'coronal' | 'sagittal', index: number) => {
    setSliceIndices(prev => ({ ...prev, [view]: index }));
    
    // If views are linked, update crosshair position in other views
    if (linkedViews) {
      // This would calculate corresponding slices in other views based on 3D position
      // For now, keep them independent
    }
  }, [linkedViews]);

  const handleFullscreen = useCallback((view: 'axial' | 'coronal' | 'sagittal') => {
    setActiveViewport(view);
    // Could trigger fullscreen mode for the selected viewport
  }, []);

  const resetAllViews = () => {
    setSliceIndices({
      axial: Math.floor(series.axial.length / 2),
      coronal: Math.floor(series.coronal.length / 2),
      sagittal: Math.floor(series.sagittal.length / 2)
    });
    setZoom(100);
  };

  const hasImages = series.axial.length > 0 || series.coronal.length > 0 || series.sagittal.length > 0;

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Layers className="w-3 h-3 mr-1" />
            DICOM Multi-View
          </Badge>
          
          {hasImages && (
            <>
              <Badge variant="outline" className="text-white/60">
                Axial: {series.axial.length} cortes
              </Badge>
              <Badge variant="outline" className="text-white/60">
                Coronal: {series.coronal.length} cortes
              </Badge>
              <Badge variant="outline" className="text-white/60">
                Sagital: {series.sagittal.length} cortes
              </Badge>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white/60 hover:text-white",
              showCrosshair && "text-cyan-400"
            )}
            onClick={() => setShowCrosshair(!showCrosshair)}
          >
            Crosshair
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white/60 hover:text-white",
              linkedViews && "text-green-400"
            )}
            onClick={() => setLinkedViews(!linkedViews)}
          >
            Link Views
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
            onClick={resetAllViews}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <label>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={isLoading}
              asChild
            >
              <span>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Cargar DICOM
              </span>
            </Button>
            <input
              type="file"
              multiple
              accept="image/*,.dcm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Viewports Grid */}
      <div className="flex-1 grid grid-cols-3 gap-1 p-1">
        {/* Axial View */}
        <div className="relative">
          <DICOMViewport
            viewportType="axial"
            isActive={activeViewport === 'axial'}
            onActivate={() => setActiveViewport('axial')}
            onFullscreen={() => handleFullscreen('axial')}
            showCrosshair={showCrosshair}
            zoom={zoom}
            imageUrl={series.axial[sliceIndices.axial]?.url}
            sliceIndex={sliceIndices.axial}
            totalSlices={series.axial.length}
            onSliceChange={(idx) => handleSliceChange('axial', idx)}
          />
        </div>

        {/* Coronal View */}
        <div className="relative">
          <DICOMViewport
            viewportType="coronal"
            isActive={activeViewport === 'coronal'}
            onActivate={() => setActiveViewport('coronal')}
            onFullscreen={() => handleFullscreen('coronal')}
            showCrosshair={showCrosshair}
            zoom={zoom}
            imageUrl={series.coronal[sliceIndices.coronal]?.url}
            sliceIndex={sliceIndices.coronal}
            totalSlices={series.coronal.length}
            onSliceChange={(idx) => handleSliceChange('coronal', idx)}
          />
        </div>

        {/* Sagittal View */}
        <div className="relative">
          <DICOMViewport
            viewportType="sagittal"
            isActive={activeViewport === 'sagittal'}
            onActivate={() => setActiveViewport('sagittal')}
            onFullscreen={() => handleFullscreen('sagittal')}
            showCrosshair={showCrosshair}
            zoom={zoom}
            imageUrl={series.sagittal[sliceIndices.sagittal]?.url}
            sliceIndex={sliceIndices.sagittal}
            totalSlices={series.sagittal.length}
            onSliceChange={(idx) => handleSliceChange('sagittal', idx)}
          />
        </div>
      </div>

      {/* Global Controls */}
      {hasImages && (
        <div className="p-2 bg-black/80 border-t border-white/10 flex items-center gap-4">
          <span className="text-xs text-white/60">Zoom Global:</span>
          <div className="flex-1 max-w-48">
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={25}
              max={400}
              step={25}
            />
          </div>
          <span className="text-xs text-white/60">{zoom}%</span>
        </div>
      )}

      {/* Empty State */}
      {!hasImages && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white/50"
          >
            <FileImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No hay imágenes cargadas</p>
            <p className="text-sm mb-4">Carga archivos DICOM o imágenes para visualizar</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MultiViewDICOM;
