import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Center, PerspectiveCamera, OrthographicCamera, Html } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Home, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Viewport, SceneObject } from "./types";
import { cn } from "@/lib/utils";

// Loading Fallback
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#6366f1" wireframe />
  </mesh>
);

// STL Model Component with opacity and visibility support
interface ModelProps {
  url: string;
  color: string;
  opacity: number;
  visible: boolean;
  wireframe?: boolean;
  autoRotate?: boolean;
}

const STLModel = ({ url, color, opacity, visible, wireframe = false, autoRotate = false }: ModelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);

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

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        wireframe={wireframe}
        metalness={0.2}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// PLY Model Component
const PLYModel = ({ url, color, opacity, visible, wireframe = false, autoRotate = false }: ModelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(PLYLoader, url);

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

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        wireframe={wireframe}
        metalness={0.2}
        roughness={0.5}
        side={THREE.DoubleSide}
        vertexColors={geometry.hasAttribute('color')}
      />
    </mesh>
  );
};

// Placeholder Demo Model
const PlaceholderModel = ({ color, opacity }: { color: string; opacity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <torusKnotGeometry args={[0.8, 0.3, 100, 16]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.3}
        metalness={0.5}
      />
    </mesh>
  );
};

// Crosshair Overlay
const CrosshairOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
    </div>
  );
};

// Navigation Cube (simplified version)
const NavigationGizmo = ({ onViewChange }: { onViewChange: (view: string) => void }) => {
  const views = [
    { label: 'T', view: 'top', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-full -mt-1' },
    { label: 'F', view: 'front', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { label: 'L', view: 'left', position: 'top-1/2 left-0 -translate-y-1/2 ml-1' },
    { label: 'R', view: 'right', position: 'top-1/2 right-0 -translate-y-1/2 mr-1' },
  ];

  return (
    <div className="absolute bottom-3 right-3 w-16 h-16 bg-black/40 rounded-lg backdrop-blur-sm border border-white/10">
      <div className="relative w-full h-full">
        {views.map(({ label, view }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="absolute w-5 h-5 bg-white/10 hover:bg-white/30 rounded text-[10px] font-bold text-white/80 hover:text-white transition-colors flex items-center justify-center"
            style={{
              top: view === 'top' ? '2px' : view === 'front' ? '50%' : '50%',
              left: view === 'left' ? '2px' : view === 'right' ? 'auto' : '50%',
              right: view === 'right' ? '2px' : 'auto',
              transform: view === 'front' ? 'translate(-50%, -50%)' : 
                         view === 'top' ? 'translateX(-50%)' :
                         'translateY(-50%)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ViewportCanvasProps {
  viewport: Viewport;
  isActive: boolean;
  onActivate: () => void;
  onFullscreen: () => void;
  showCrosshair: boolean;
  showGrid: boolean;
  lightIntensity: number;
  modelUrl: string | null;
  modelType: 'stl' | 'ply' | 'obj';
  sceneObjects: SceneObject[];
  wireframe?: boolean;
  autoRotate?: boolean;
}

export const ViewportCanvas = ({
  viewport,
  isActive,
  onActivate,
  onFullscreen,
  showCrosshair,
  showGrid,
  lightIntensity,
  modelUrl,
  modelType,
  sceneObjects,
  wireframe = false,
  autoRotate = false,
}: ViewportCanvasProps) => {
  const [zoom, setZoom] = useState(viewport.zoom);

  const getCameraProps = () => {
    switch (viewport.type) {
      case 'axial':
        return { position: [0, 10, 0.01] as [number, number, number] };
      case 'coronal':
        return { position: [0, 0, 10] as [number, number, number] };
      case 'sagittal':
        return { position: [10, 0, 0] as [number, number, number] };
      default:
        return { position: [5, 5, 5] as [number, number, number] };
    }
  };

  const findObjectById = (objects: SceneObject[], id: string): SceneObject | undefined => {
    for (const obj of objects) {
      if (obj.id === id) return obj;
      if (obj.children) {
        const found = findObjectById(obj.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const teethObj = findObjectById(sceneObjects, 'teeth');
  const modelColor = teethObj?.color || '#f5f5dc';
  const modelOpacity = teethObj?.opacity || 1;
  const modelVisible = teethObj?.visible ?? true;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer transition-all",
        "bg-gradient-to-b from-gray-900 to-gray-800",
        isActive 
          ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/20" 
          : "ring-1 ring-border hover:ring-2 hover:ring-border"
      )}
      onClick={onActivate}
    >
      {/* Viewport Label */}
      <div className="absolute top-2 left-2 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        {viewport.name}
      </div>

      {/* Zoom Indicator */}
      <div className="absolute top-2 right-12 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Fullscreen Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-20 w-7 h-7 bg-black/60 hover:bg-black/80 text-white"
        onClick={(e) => {
          e.stopPropagation();
          onFullscreen();
        }}
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </Button>

      {/* Crosshair */}
      <CrosshairOverlay show={showCrosshair} />

      {/* 3D Canvas */}
      <Canvas
        shadows
        className="w-full h-full"
        style={{ minHeight: '200px' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a2e');
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <PerspectiveCamera
            makeDefault
            position={getCameraProps().position}
            fov={50}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4 * lightIntensity} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={lightIntensity}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-10, -10, -5]} intensity={0.3 * lightIntensity} />
          <spotLight position={[0, 10, 0]} intensity={0.5 * lightIntensity} />
          <Environment preset="studio" />

          {/* Grid */}
          {showGrid && viewport.type === 'perspective' && (
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#4a4a6a"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#6a6a8a"
              fadeDistance={25}
              fadeStrength={1}
              infiniteGrid
            />
          )}

          {/* Model */}
          <Center>
            {modelUrl && modelVisible ? (
              modelType === 'stl' ? (
                <STLModel
                  url={modelUrl}
                  color={modelColor}
                  opacity={modelOpacity}
                  visible={modelVisible}
                  wireframe={wireframe}
                  autoRotate={autoRotate && viewport.type === 'perspective'}
                />
              ) : modelType === 'ply' ? (
                <PLYModel
                  url={modelUrl}
                  color={modelColor}
                  opacity={modelOpacity}
                  visible={modelVisible}
                  wireframe={wireframe}
                  autoRotate={autoRotate && viewport.type === 'perspective'}
                />
              ) : null
            ) : (
              <PlaceholderModel color={modelColor} opacity={modelOpacity} />
            )}
          </Center>

          {/* Controls */}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate={viewport.type === 'perspective'}
            minDistance={2}
            maxDistance={20}
            onChange={(e) => {
              if (e?.target) {
                const distance = e.target.getDistance();
                setZoom(Math.max(0.1, Math.min(2, 10 / distance)));
              }
            }}
          />
        </Suspense>
      </Canvas>

      {/* Navigation Gizmo for Main Viewport */}
      {viewport.type === 'perspective' && (
        <NavigationGizmo onViewChange={(view) => console.log('View:', view)} />
      )}
    </div>
  );
};

export default ViewportCanvas;
