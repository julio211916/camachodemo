import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Center } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  Grid3x3,
  Palette,
  Box,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Move3D,
  Sun,
  Moon,
  Folder,
  FileBox
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Model3DViewerCloudProps {
  patientId?: string;
  patientName?: string;
}

// STL Model Component
const STLModelComponent = ({ 
  url, 
  color, 
  wireframe, 
  autoRotate 
}: { 
  url: string; 
  color: string; 
  wireframe: boolean;
  autoRotate: boolean;
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

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
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
  autoRotate 
}: { 
  url: string; 
  color: string; 
  wireframe: boolean;
  autoRotate: boolean;
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

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
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

// OBJ Model Component
const OBJModelComponent = ({ 
  url, 
  color, 
  wireframe,
  autoRotate 
}: { 
  url: string; 
  color: string; 
  wireframe: boolean;
  autoRotate: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const obj = useLoader(OBJLoader, url);

  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  useEffect(() => {
    if (obj) {
      // Center the model
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      obj.position.sub(center);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      obj.scale.setScalar(scale);

      // Apply material to all meshes
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = new THREE.MeshStandardMaterial({
            color: color,
            wireframe: wireframe,
            metalness: 0.3,
            roughness: 0.4,
            side: THREE.DoubleSide
          });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }
  }, [obj, color, wireframe]);

  return <primitive ref={groupRef} object={obj.clone()} />;
};

// Loading fallback
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#6366f1" wireframe />
  </mesh>
);

export const Model3DViewerCloud = ({ patientId, patientName }: Model3DViewerCloudProps) => {
  const { toast } = useToast();
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

  // Fetch 3D models from storage
  const { data: cloudModels, refetch: refetchModels } = useQuery({
    queryKey: ['3d-models', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
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

  // Load model from cloud
  const loadCloudModel = useCallback(async (doc: any) => {
    setIsLoading(true);
    try {
      const extension = doc.file_name.split('.').pop()?.toLowerCase();
      if (!['stl', 'ply', 'obj'].includes(extension)) {
        throw new Error('Formato no soportado');
      }

      const resolvedUrl = (typeof doc.file_url === 'string' && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')))
        ? doc.file_url
        : await getSignedUrl('patient-files', doc.file_url);

      if (!resolvedUrl) throw new Error('No se pudo generar URL firmada');

      setModelUrl(resolvedUrl);
      setModelType(extension as 'stl' | 'ply' | 'obj');
      setModelName(doc.file_name);

      toast({
        title: "Modelo cargado",
        description: doc.file_name
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el modelo",
        variant: "destructive"
      });
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
      toast({
        title: "Formato no soportado",
        description: "Por favor suba un archivo STL, PLY u OBJ",
        variant: "destructive"
      });
      return;
    }

    // Create local URL for immediate preview
    const localUrl = URL.createObjectURL(file);
    setModelUrl(localUrl);
    setModelType(extension as 'stl' | 'ply' | 'obj');
    setModelName(file.name);

    // Upload to cloud if patientId exists
    if (patientId) {
      setIsUploading(true);
      try {
        const fileName = `${patientId}/models/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save document record (store path only)
        await supabase.from('patient_documents').insert({
          patient_id: patientId,
          file_name: file.name,
          file_url: fileName,
          document_type: '3d-model',
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size
        });

        refetchModels();

        toast({
          title: "Modelo guardado",
          description: "El modelo 3D se ha guardado en el expediente"
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Advertencia",
          description: "El modelo se cargó localmente pero no se pudo guardar en la nube",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      toast({
        title: "Modelo cargado",
        description: file.name
      });
    }
  };

  const resetView = () => {
    setModelColor('#f5f5dc');
    setWireframe(false);
    setShowGrid(true);
    setAutoRotate(false);
    setLightIntensity(1);
  };

  const downloadModel = () => {
    if (modelUrl) {
      const link = document.createElement('a');
      link.href = modelUrl;
      link.download = modelName || 'model.stl';
      link.click();
    }
  };

  const ViewerCanvas = () => (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      className="w-full h-full"
    >
      <Suspense fallback={<LoadingFallback />}>
        {/* Lighting */}
        <ambientLight intensity={0.4 * lightIntensity} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={lightIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.3 * lightIntensity}
        />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Grid */}
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

        {/* Model */}
        {modelUrl && (
          <Center>
            {modelType === 'stl' && (
              <STLModelComponent 
                url={modelUrl} 
                color={modelColor} 
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            )}
            {modelType === 'ply' && (
              <PLYModelComponent 
                url={modelUrl} 
                color={modelColor} 
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            )}
            {modelType === 'obj' && (
              <OBJModelComponent 
                url={modelUrl} 
                color={modelColor} 
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            )}
          </Center>
        )}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />
      </Suspense>
    </Canvas>
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Move3D className="w-5 h-5" />
            Visor 3D
            {patientName && <Badge variant="secondary">{patientName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetView}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cloud Models Selector */}
          {cloudModels && cloudModels.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Modelos del Paciente</label>
              <Select onValueChange={(id) => {
                const doc = cloudModels.find(d => d.id === id);
                if (doc) loadCloudModel(doc);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar modelo guardado..." />
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
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl flex-wrap">
            {/* File Upload */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Cargar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.ply,.obj"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="h-6 w-px bg-border" />

            {/* Wireframe Toggle */}
            <Button
              variant={wireframe ? "default" : "outline"}
              size="sm"
              onClick={() => setWireframe(!wireframe)}
              title="Wireframe"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            {/* Grid Toggle */}
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Grid"
            >
              {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            {/* Auto Rotate */}
            <Button
              variant={autoRotate ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRotate(!autoRotate)}
              title="Auto-rotar"
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </Button>

            {modelUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadModel}
                title="Descargar"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}

            <div className="h-6 w-px bg-border" />

            {/* Color Presets */}
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-muted-foreground mr-1" />
              {colorPresets.slice(0, 6).map((preset) => (
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

            <div className="h-6 w-px bg-border" />

            {/* Light Intensity */}
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[lightIntensity]}
                onValueChange={([v]) => setLightIntensity(v)}
                min={0.2}
                max={2}
                step={0.1}
                className="w-20"
              />
              <Sun className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* 3D Canvas */}
          <div 
            className="relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden"
            style={{ height: '450px' }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            <ViewerCanvas />

            {/* Info Overlay */}
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

          {/* Model Info */}
          {modelUrl && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground">Archivo</p>
                <p className="font-medium truncate" title={modelName}>{modelName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Formato</p>
                <p className="font-medium uppercase">{modelType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: modelColor }} />
                  <span className="font-medium text-sm">{colorPresets.find(p => p.color === modelColor)?.label || 'Custom'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visualización</p>
                <p className="font-medium">{wireframe ? 'Wireframe' : 'Sólido'}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center">
            <p>🖱️ Click + arrastrar: Rotar | Scroll: Zoom | Click derecho + arrastrar: Mover</p>
          </div>
        </CardContent>
      </Card>

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
          
          {/* Fullscreen Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
              {colorPresets.map((preset) => (
                <button
                  key={preset.color}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    modelColor === preset.color ? 'border-primary ring-2 ring-primary' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => setModelColor(preset.color)}
                  title={preset.label}
                />
              ))}
              
              <div className="w-px h-6 bg-white/20" />
              
              <Button
                variant={wireframe ? "default" : "secondary"}
                size="sm"
                onClick={() => setWireframe(!wireframe)}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              
              <Button
                variant={autoRotate ? "default" : "secondary"}
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
              >
                <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Model3DViewerCloud;
