import { useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Environment, Grid } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Moon
} from "lucide-react";
import * as THREE from "three";

interface Model3DViewerProps {
  fileUrl?: string;
  fileName?: string;
  onFileSelect?: (file: File) => void;
}

// STL Loader Component
const STLModel = ({ url, color, wireframe }: { url: string; color: string; wireframe: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation animation
      // meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={color} 
        wireframe={wireframe}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
};

// PLY Model placeholder
const PLYModel = ({ url, color }: { url: string; color: string }) => {
  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

// OBJ Model placeholder
const OBJModel = ({ url, color }: { url: string; color: string }) => {
  return (
    <mesh castShadow receiveShadow>
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
};

export const Model3DViewer = ({ fileUrl, fileName, onFileSelect }: Model3DViewerProps) => {
  const { toast } = useToast();
  const [modelUrl, setModelUrl] = useState<string | null>(fileUrl || null);
  const [modelType, setModelType] = useState<'stl' | 'ply' | 'obj'>('stl');
  const [modelColor, setModelColor] = useState('#e0e0e0');
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorPresets = [
    { color: '#e0e0e0', label: 'Gris Claro' },
    { color: '#f5deb3', label: 'Hueso' },
    { color: '#ffc0cb', label: 'Encía' },
    { color: '#ffffff', label: 'Blanco' },
    { color: '#c0c0c0', label: 'Metal' },
    { color: '#87ceeb', label: 'Azul' }
  ];

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

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setModelType(extension as 'stl' | 'ply' | 'obj');
      onFileSelect?.(file);
      
      toast({
        title: "Modelo cargado",
        description: `${file.name} cargado correctamente`
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
  };

  const resetView = () => {
    setModelColor('#e0e0e0');
    setWireframe(false);
    setShowGrid(true);
    setAutoRotate(false);
    setLightIntensity(1);
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Move3D className="w-5 h-5" />
          Visor 3D
          {fileName && <Badge variant="secondary">{fileName}</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetView}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl flex-wrap">
          {/* File Upload */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Cargar Modelo
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
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>

          {/* Grid Toggle */}
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          {/* Auto Rotate */}
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Color Presets */}
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-muted-foreground mr-1" />
            {colorPresets.map((preset) => (
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
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          <Canvas
            shadows
            camera={{ position: [5, 5, 5], fov: 50 }}
            className="w-full h-full"
          >
            <Suspense fallback={null}>
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
              {modelUrl ? (
                <Stage environment="studio" intensity={0.5}>
                  {modelType === 'stl' && (
                    <STLModel url={modelUrl} color={modelColor} wireframe={wireframe} />
                  )}
                  {modelType === 'ply' && (
                    <PLYModel url={modelUrl} color={modelColor} />
                  )}
                  {modelType === 'obj' && (
                    <OBJModel url={modelUrl} color={modelColor} />
                  )}
                </Stage>
              ) : (
                <mesh>
                  <boxGeometry args={[2, 2, 2]} />
                  <meshStandardMaterial color={modelColor} wireframe={wireframe} />
                </mesh>
              )}

              {/* Controls */}
              <OrbitControls
                autoRotate={autoRotate}
                autoRotateSpeed={2}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={20}
              />
            </Suspense>
          </Canvas>

          {/* Info Overlay */}
          {!modelUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Carga un modelo STL, PLY u OBJ</p>
                <p className="text-sm">Usa el mouse para rotar, zoom y mover</p>
              </div>
            </div>
          )}
        </div>

        {/* Model Info */}
        {modelUrl && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Formato</p>
              <p className="font-medium uppercase">{modelType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Color</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: modelColor }} />
                <span className="font-medium">{modelColor}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wireframe</p>
              <p className="font-medium">{wireframe ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rotación</p>
              <p className="font-medium">{autoRotate ? 'Automática' : 'Manual'}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center">
          <p>🖱️ Click izquierdo + arrastrar: Rotar | Scroll: Zoom | Click derecho + arrastrar: Mover</p>
        </div>
      </CardContent>
    </Card>
  );
};
