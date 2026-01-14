import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, FileImage, Layers, RefreshCw, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DICOMViewport } from "./DICOMViewport";
import { useDicomLoader } from "@/hooks/useDicomLoader";
import { usePatientContext } from "@/contexts/PatientContext";

interface DICOMSlice {
  imageData: ImageData;
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

export const MultiViewDICOM = ({ onClose, patientId: propPatientId }: MultiViewDICOMProps) => {
  // Use patient context if no prop patientId provided
  const patientContext = usePatientContext();
  const effectivePatientId = propPatientId || patientContext?.selectedPatient?.userId;
  
  const {
    studies,
    loadingStudies,
    loadingStudy,
    loadedSeries,
    loadStudy,
    uploadDicomFiles,
    windowCenter,
    windowWidth,
    updateWindowLevel,
  } = useDicomLoader(effectivePatientId);

  const [series, setSeries] = useState<DICOMSeries>({
    axial: [],
    coronal: [],
    sagittal: []
  });
  const [activeViewport, setActiveViewport] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [sliceIndices, setSliceIndices] = useState({ axial: 0, coronal: 0, sagittal: 0 });
  const [linkedViews, setLinkedViews] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When loaded series changes, update the view
  useEffect(() => {
    if (loadedSeries && loadedSeries.renderedImages.length > 0) {
      const axialSlices: DICOMSlice[] = loadedSeries.renderedImages.map((img, idx) => ({
        imageData: img,
        sliceIndex: idx,
      }));

      // For single slice, duplicate for other views (simplified MPR)
      const coronalSlices = axialSlices.length > 0 ? [axialSlices[0]] : [];
      const sagittalSlices = axialSlices.length > 0 ? [axialSlices[0]] : [];

      setSeries({
        axial: axialSlices,
        coronal: coronalSlices,
        sagittal: sagittalSlices,
      });

      setSliceIndices({
        axial: Math.floor(axialSlices.length / 2),
        coronal: 0,
        sagittal: 0,
      });
    }
  }, [loadedSeries]);

  // Handle file upload from local
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadDicomFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadDicomFiles]);

  // Handle study selection
  const handleStudySelect = useCallback((studyId: string) => {
    setSelectedStudyId(studyId);
    const study = studies.find(s => s.id === studyId);
    if (study) {
      loadStudy(study);
    }
  }, [studies, loadStudy]);

  const handleSliceChange = useCallback((view: 'axial' | 'coronal' | 'sagittal', index: number) => {
    setSliceIndices(prev => ({ ...prev, [view]: index }));
  }, []);

  const handleFullscreen = useCallback((view: 'axial' | 'coronal' | 'sagittal') => {
    setActiveViewport(view);
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
  const isLoading = loadingStudy !== null;

  // Get image URL from ImageData (for viewport)
  const getImageUrlFromData = (imageData: ImageData | undefined): string | undefined => {
    if (!imageData) return undefined;
    
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-black/80 border-b border-white/10 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Layers className="w-3 h-3 mr-1" />
            DICOM Multi-View
          </Badge>
          
          {/* Study Selector */}
          {studies.length > 0 && (
            <Select value={selectedStudyId} onValueChange={handleStudySelect}>
              <SelectTrigger className="w-48 h-8 text-xs bg-white/5 border-white/20 text-white">
                <Folder className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Seleccionar estudio" />
              </SelectTrigger>
              <SelectContent>
                {studies.map((study) => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
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
          
          {loadingStudies && (
            <Badge variant="outline" className="text-yellow-300">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Cargando estudios...
            </Badge>
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
              disabled={isLoading || !effectivePatientId}
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
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.dcm,application/dicom"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!effectivePatientId}
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
            imageUrl={getImageUrlFromData(series.axial[sliceIndices.axial]?.imageData)}
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
            imageUrl={getImageUrlFromData(series.coronal[sliceIndices.coronal]?.imageData)}
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
            imageUrl={getImageUrlFromData(series.sagittal[sliceIndices.sagittal]?.imageData)}
            sliceIndex={sliceIndices.sagittal}
            totalSlices={series.sagittal.length}
            onSliceChange={(idx) => handleSliceChange('sagittal', idx)}
          />
        </div>
      </div>

      {/* Global Controls */}
      {hasImages && (
        <div className="p-2 bg-black/80 border-t border-white/10 flex items-center gap-4 flex-wrap">
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
          
          {windowCenter !== undefined && windowWidth !== undefined && (
            <>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-xs text-white/60">WL:</span>
              <div className="w-24">
                <Slider
                  value={[windowCenter]}
                  onValueChange={([v]) => updateWindowLevel(v, windowWidth)}
                  min={-1000}
                  max={3000}
                  step={10}
                />
              </div>
              <span className="text-xs text-white/60">WW:</span>
              <div className="w-24">
                <Slider
                  value={[windowWidth]}
                  onValueChange={([v]) => updateWindowLevel(windowCenter, v)}
                  min={1}
                  max={4000}
                  step={10}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasImages && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white/50"
          >
            <FileImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">
              {!effectivePatientId ? 'Seleccione un paciente' : 'No hay imágenes cargadas'}
            </p>
            <p className="text-sm mb-4">
              {effectivePatientId 
                ? 'Carga archivos DICOM o selecciona un estudio existente'
                : 'Use el selector de pacientes en la barra lateral'
              }
            </p>
          </motion.div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
            <p>Procesando DICOM...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiViewDICOM;
