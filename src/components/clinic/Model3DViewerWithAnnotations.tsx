import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Center, Html } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCw, ZoomIn, ZoomOut, Maximize2, Download, Upload, Grid3x3,
  Palette, Box, Eye, EyeOff, RefreshCw, Loader2, Move3D, Sun, Moon,
  Folder, FileBox, MapPin, Ruler, Trash2, Save, Plus, X, Target,
  PenTool, Circle, MessageSquare
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Annotation {
  id: string;
  position: [number, number, number];
  label: string;
  description: string;
  color: string;
  type: 'point' | 'measurement';
  endPosition?: [number, number, number];
  distance?: number;
}

interface Model3DViewerWithAnnotationsProps {
  patientId: string;
  patientName?: string;
  onClose?: () => void;
}

// Annotation Marker Component
const AnnotationMarker = ({ 
  annotation, 
  isSelected, 
  onClick,
  onDelete 
}: { 
  annotation: Annotation; 
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) => {
  return (
    <group position={annotation.position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial 
          color={annotation.color} 
          emissive={annotation.color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Line for measurements */}
      {annotation.type === 'measurement' && annotation.endPosition && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                0, 0, 0,
                annotation.endPosition[0] - annotation.position[0],
                annotation.endPosition[1] - annotation.position[1],
                annotation.endPosition[2] - annotation.position[2]
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={annotation.color} linewidth={2} />
        </line>
      )}
      
      {/* Label */}
      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={5}
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-background/90 text-foreground border shadow-sm'
          }`}
        >
          {annotation.label}
          {annotation.type === 'measurement' && annotation.distance && (
            <span className="ml-1 font-bold">{annotation.distance.toFixed(2)}mm</span>
          )}
        </div>
      </Html>
    </group>
  );
};

// STL Model Component
const STLModelComponent = ({ 
  url, 
  color, 
  wireframe, 
  autoRotate,
  onPointClick,
  isAnnotating
}: { 
  url: string; 
  color: string; 
  wireframe: boolean;
  autoRotate: boolean;
  onPointClick: (point: THREE.Vector3) => void;
  isAnnotating: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  useEffect(() => {
    if (geometry) {
      geometry.center();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      
      const boundingBox = geometry.boundingBox;
      if (boundingBox) {
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        geometry.scale(scale, scale, scale);
      }
    }
  }, [geometry]);

  const handleClick = (event: any) => {
    if (isAnnotating && event.point) {
      onPointClick(event.point);
    }
  };

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      castShadow 
      receiveShadow
      onClick={handleClick}
    >
      <meshStandardMaterial 
        color={color} 
        wireframe={wireframe}
        metalness={0.3}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// PLY Model Component
const PLYModelComponent = ({ 
  url, 
  color, 
  wireframe,
  autoRotate,
  onPointClick,
  isAnnotating
}: { 
  url: string; 
  color: string; 
  wireframe: boolean;
  autoRotate: boolean;
  onPointClick: (point: THREE.Vector3) => void;
  isAnnotating: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(PLYLoader, url);

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  useEffect(() => {
    if (geometry) {
      geometry.center();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      
      const boundingBox = geometry.boundingBox;
      if (boundingBox) {
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        geometry.scale(scale, scale, scale);
      }
    }
  }, [geometry]);

  const handleClick = (event: any) => {
    if (isAnnotating && event.point) {
      onPointClick(event.point);
    }
  };

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      castShadow 
      receiveShadow
      onClick={handleClick}
    >
      <meshStandardMaterial 
        color={color} 
        wireframe={wireframe}
        metalness={0.2}
        roughness={0.5}
        side={THREE.DoubleSide}
        vertexColors={geometry.hasAttribute('color')}
      />
    </mesh>
  );
};

// Loading fallback
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#6366f1" wireframe />
  </mesh>
);

export const Model3DViewerWithAnnotations = ({ patientId, patientName, onClose }: Model3DViewerWithAnnotationsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'stl' | 'ply' | 'obj'>('stl');
  const [modelName, setModelName] = useState<string>('');
  const [modelColor, setModelColor] = useState('#f5f5dc');
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<'point' | 'measurement'>('point');
  const [measurementStart, setMeasurementStart] = useState<THREE.Vector3 | null>(null);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<THREE.Vector3 | null>(null);
  const [newAnnotation, setNewAnnotation] = useState({ label: '', description: '', color: '#ef4444' });

  // Fetch 3D models from storage
  const { data: cloudModels, refetch: refetchModels } = useQuery({
    queryKey: ['3d-models', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .or('document_type.eq.3d-model,file_name.ilike.%.stl,file_name.ilike.%.ply,file_name.ilike.%.obj')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId
  });

  const colorPresets = [
    { color: '#f5f5dc', label: 'Marfil' },
    { color: '#ffffff', label: 'Blanco' },
    { color: '#ffc0cb', label: 'Rosa' },
    { color: '#e0e0e0', label: 'Gris Claro' },
    { color: '#808080', label: 'Gris' },
    { color: '#c0c0c0', label: 'Metal' },
    { color: '#87ceeb', label: 'Azul' },
    { color: '#98fb98', label: 'Verde' }
  ];

  const annotationColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  // Load model from cloud
  const loadCloudModel = useCallback(async (doc: any) => {
    setIsLoading(true);
    try {
      const extension = doc.file_name.split('.').pop()?.toLowerCase();
      if (!['stl', 'ply', 'obj'].includes(extension)) {
        throw new Error('Formato no soportado');
      }

      setModelUrl(doc.file_url);
      setModelType(extension as 'stl' | 'ply' | 'obj');
      setModelName(doc.file_name);
      setAnnotations([]); // Reset annotations when loading new model
      
      toast({ title: "Modelo cargado", description: doc.file_name });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el modelo", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Upload local file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'ply', 'obj'].includes(extension || '')) {
      toast({ title: "Formato no soportado", description: "Por favor suba un archivo STL, PLY u OBJ", variant: "destructive" });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setModelUrl(localUrl);
    setModelType(extension as 'stl' | 'ply' | 'obj');
    setModelName(file.name);
    setAnnotations([]);

    if (patientId) {
      setIsUploading(true);
      try {
        const fileName = `${patientId}/models/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('patient-files')
          .getPublicUrl(fileName);

        await supabase.from('patient_documents').insert({
          patient_id: patientId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          document_type: '3d-model',
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size
        });

        refetchModels();
        toast({ title: "Modelo guardado", description: "El modelo 3D se ha guardado en el expediente" });
      } catch (error) {
        toast({ title: "Advertencia", description: "El modelo se cargó localmente pero no se pudo guardar", variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle point click for annotations
  const handlePointClick = (point: THREE.Vector3) => {
    if (!isAnnotating) return;

    if (annotationMode === 'measurement') {
      if (!measurementStart) {
        setMeasurementStart(point);
        toast({ title: "Punto inicial marcado", description: "Haz clic en el punto final para medir" });
      } else {
        const distance = measurementStart.distanceTo(point) * 10; // Scale to mm
        const newMeasurement: Annotation = {
          id: crypto.randomUUID(),
          position: [measurementStart.x, measurementStart.y, measurementStart.z],
          endPosition: [point.x, point.y, point.z],
          label: `Medida ${annotations.filter(a => a.type === 'measurement').length + 1}`,
          description: `Distancia: ${distance.toFixed(2)}mm`,
          color: '#3b82f6',
          type: 'measurement',
          distance
        };
        setAnnotations([...annotations, newMeasurement]);
        setMeasurementStart(null);
        toast({ title: "Medición completada", description: `Distancia: ${distance.toFixed(2)}mm` });
      }
    } else {
      setPendingPoint(point);
      setShowAnnotationDialog(true);
    }
  };

  // Save annotation
  const saveAnnotation = () => {
    if (!pendingPoint || !newAnnotation.label) return;

    const annotation: Annotation = {
      id: crypto.randomUUID(),
      position: [pendingPoint.x, pendingPoint.y, pendingPoint.z],
      label: newAnnotation.label,
      description: newAnnotation.description,
      color: newAnnotation.color,
      type: 'point'
    };

    setAnnotations([...annotations, annotation]);
    setShowAnnotationDialog(false);
    setPendingPoint(null);
    setNewAnnotation({ label: '', description: '', color: '#ef4444' });
    toast({ title: "Anotación guardada" });
  };

  // Delete annotation
  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    if (selectedAnnotation?.id === id) setSelectedAnnotation(null);
  };

  const resetView = () => {
    setModelColor('#f5f5dc');
    setWireframe(false);
    setShowGrid(true);
    setAutoRotate(false);
    setLightIntensity(1);
  };

  const ViewerCanvas = () => (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }} className="w-full h-full">
      <Suspense fallback={<LoadingFallback />}>
        <ambientLight intensity={0.4 * lightIntensity} />
        <directionalLight position={[10, 10, 5]} intensity={lightIntensity} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3 * lightIntensity} />
        <Environment preset="studio" />

        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#6e6e6e"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
        )}

        {modelUrl && (
          <Center>
            {modelType === 'stl' && (
              <STLModelComponent 
                url={modelUrl} 
                color={modelColor} 
                wireframe={wireframe}
                autoRotate={autoRotate}
                onPointClick={handlePointClick}
                isAnnotating={isAnnotating}
              />
            )}
            {modelType === 'ply' && (
              <PLYModelComponent 
                url={modelUrl} 
                color={modelColor} 
                wireframe={wireframe}
                autoRotate={autoRotate}
                onPointClick={handlePointClick}
                isAnnotating={isAnnotating}
              />
            )}
          </Center>
        )}

        {/* Render Annotations */}
        {annotations.map((annotation) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            isSelected={selectedAnnotation?.id === annotation.id}
            onClick={() => setSelectedAnnotation(annotation)}
            onDelete={() => deleteAnnotation(annotation.id)}
          />
        ))}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={1} maxDistance={20} />
      </Suspense>
    </Canvas>
  );

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Move3D className="w-5 h-5" />
            Visor 3D con Anotaciones
            {patientName && <Badge variant="secondary">{patientName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Cloud Models Selector */}
          {cloudModels && cloudModels.length > 0 && (
            <Select onValueChange={(id) => {
              const doc = cloudModels.find(d => d.id === id);
              if (doc) loadCloudModel(doc);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar modelo del paciente..." />
              </SelectTrigger>
              <SelectContent>
                {cloudModels.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileBox className="w-4 h-4" />
                      {doc.file_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Annotation Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="ml-2">Cargar</span>
            </Button>
            <input ref={fileInputRef} type="file" accept=".stl,.ply,.obj" className="hidden" onChange={handleFileUpload} />

            <div className="h-6 w-px bg-border" />

            {/* Annotation Tools */}
            <Button
              variant={isAnnotating && annotationMode === 'point' ? "default" : "outline"}
              size="sm"
              onClick={() => { setIsAnnotating(!isAnnotating || annotationMode !== 'point'); setAnnotationMode('point'); setMeasurementStart(null); }}
              title="Agregar anotación"
            >
              <MapPin className="w-4 h-4" />
            </Button>

            <Button
              variant={isAnnotating && annotationMode === 'measurement' ? "default" : "outline"}
              size="sm"
              onClick={() => { setIsAnnotating(!isAnnotating || annotationMode !== 'measurement'); setAnnotationMode('measurement'); setMeasurementStart(null); }}
              title="Medir distancia"
            >
              <Ruler className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* View Controls */}
            <Button variant={wireframe ? "default" : "outline"} size="sm" onClick={() => setWireframe(!wireframe)}>
              <Grid3x3 className="w-4 h-4" />
            </Button>

            <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
              {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            <Button variant={autoRotate ? "default" : "outline"} size="sm" onClick={() => setAutoRotate(!autoRotate)}>
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </Button>

            <Button variant="outline" size="sm" onClick={resetView}>
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Color Presets */}
            <div className="flex items-center gap-1">
              {colorPresets.slice(0, 5).map((preset) => (
                <button
                  key={preset.color}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    modelColor === preset.color ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => setModelColor(preset.color)}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Annotation Status */}
          {isAnnotating && (
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium text-primary">
                {annotationMode === 'point' 
                  ? 'Haz clic en el modelo para agregar una anotación' 
                  : measurementStart 
                    ? 'Haz clic en el punto final para completar la medición'
                    : 'Haz clic en el punto inicial para comenzar a medir'
                }
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setIsAnnotating(false); setMeasurementStart(null); }}>
                Cancelar
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex gap-4 min-h-[400px]">
            {/* 3D Canvas */}
            <div className="flex-1 relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              
              <ViewerCanvas />

              {!modelUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-muted-foreground">
                    <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Carga un modelo STL, PLY u OBJ</p>
                    <p className="text-sm">Usa el mouse para rotar, zoom y mover</p>
                  </div>
                </div>
              )}
            </div>

            {/* Annotations Panel */}
            {annotations.length > 0 && (
              <div className="w-64 border rounded-lg overflow-hidden flex flex-col bg-card">
                <div className="p-3 border-b bg-muted/50">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Anotaciones ({annotations.length})
                  </h3>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  {annotations.map((annotation) => (
                    <div 
                      key={annotation.id}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedAnnotation?.id === annotation.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="font-medium text-sm flex-1 truncate">{annotation.label}</span>
                        {annotation.type === 'measurement' && (
                          <Badge variant="secondary" className="text-xs">
                            {annotation.distance?.toFixed(1)}mm
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      {annotation.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {annotation.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Info */}
          {modelUrl && (
            <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Archivo</p>
                <p className="font-medium truncate">{modelName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Formato</p>
                <p className="font-medium uppercase">{modelType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Anotaciones</p>
                <p className="font-medium">{annotations.filter(a => a.type === 'point').length} puntos</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mediciones</p>
                <p className="font-medium">{annotations.filter(a => a.type === 'measurement').length} medidas</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Nueva Anotación
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Etiqueta *</Label>
              <Input
                value={newAnnotation.label}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, label: e.target.value })}
                placeholder="Ej: Caries, Corona, Implante..."
              />
            </div>
            
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={newAnnotation.description}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, description: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {annotationColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      newAnnotation.color === color ? 'border-foreground ring-2 ring-ring' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewAnnotation({ ...newAnnotation, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAnnotationDialog(false); setPendingPoint(null); }}>
              Cancelar
            </Button>
            <Button onClick={saveAnnotation} disabled={!newAnnotation.label}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh] p-0">
          <DialogHeader className="absolute top-2 left-4 z-10">
            <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded-lg">
              {modelName || 'Visor 3D'}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <ViewerCanvas />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Model3DViewerWithAnnotations;
