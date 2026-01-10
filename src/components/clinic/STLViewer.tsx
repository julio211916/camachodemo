import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Palette,
  Loader2,
  Maximize2,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface STLModelProps {
  url: string;
  color: string;
  autoRotate: boolean;
}

const STLModel = ({ url, color, autoRotate }: STLModelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Center and scale the geometry
  geometry.center();
  geometry.computeVertexNormals();
  
  // Calculate bounding box to normalize scale
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox;
  if (boundingBox) {
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    geometry.scale(scale, scale, scale);
  }

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={color} 
        metalness={0.3} 
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#6366f1" wireframe />
  </mesh>
);

interface STLViewerProps {
  fileUrl: string;
  fileName: string;
  onClose?: () => void;
}

const colorPresets = [
  { name: "Blanco", value: "#ffffff" },
  { name: "Marfil", value: "#f5f5dc" },
  { name: "Rosa", value: "#ffc0cb" },
  { name: "Gris", value: "#808080" },
  { name: "Azul", value: "#4a90d9" },
  { name: "Verde", value: "#6bc96b" },
];

export const STLViewer = ({ fileUrl, fileName }: STLViewerProps) => {
  const [color, setColor] = useState("#f5f5dc");
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ViewerContent = () => (
    <div className="relative w-full h-full">
      <Canvas shadows className="rounded-lg bg-gradient-to-b from-gray-900 to-gray-800">
        <perspectiveCamera position={[0, 0, zoom]} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <spotLight position={[0, 10, 0]} intensity={0.5} />
        
        <Suspense fallback={<LoadingFallback />}>
          <STLModel url={fileUrl} color={color} autoRotate={autoRotate} />
        </Suspense>
        
        <OrbitControls 
          enablePan 
          enableZoom 
          enableRotate 
          autoRotate={false}
          minDistance={2}
          maxDistance={20}
        />
        <gridHelper args={[10, 10, "#6366f1", "#818cf8"]} />
      </Canvas>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 flex flex-wrap items-center gap-4">
          {/* Color Selection */}
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-white" />
            <div className="flex gap-1">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === preset.value ? 'border-primary ring-2 ring-primary' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white/20" />
          
          {/* Auto Rotate */}
          <Button
            variant={autoRotate ? "default" : "secondary"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            className="gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            Rotar
          </Button>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white/20" />
          
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-white" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={2}
              max={15}
              step={0.5}
              className="w-24"
            />
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white/20" />
          
          {/* Download */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar
          </Button>
        </div>
      </div>
      
      {/* File Name */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-white text-sm font-medium">{fileName}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="aspect-video relative rounded-lg overflow-hidden">
        <ViewerContent />
        
        {/* Fullscreen Button */}
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh] p-0">
            <DialogHeader className="absolute top-2 left-4 z-10">
              <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded-lg">
                {fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="w-full h-full">
              <ViewerContent />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default STLViewer;
