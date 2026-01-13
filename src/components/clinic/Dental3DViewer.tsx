import { useState, Suspense, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Center, Html, PerspectiveCamera } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, ChevronRight, Eye, EyeOff, Upload, Download, 
  Grid3x3, RotateCw, RefreshCw, Maximize2, Sun, Crosshair,
  Folder, Box, Circle, Square, Loader2, X, Info, Settings,
  Layers, Move3D, Target, MapPin, ZoomIn, ZoomOut, Move
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Types
interface SceneObject {
  id: string;
  name: string;
  type: 'group' | 'mesh' | 'landmark';
  visible: boolean;
  color: string;
  opacity: number;
  children?: SceneObject[];
  parent?: string;
  expanded?: boolean;
}

interface Viewport {
  id: string;
  name: string;
  camera: 'perspective' | 'axial' | 'coronal' | 'sagittal';
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

interface Dental3DViewerProps {
  patientId?: string;
  patientName?: string;
}

// Color palette presets
const colorPalette = [
  '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#06b6d4', '#3b82f6', '#ec4899'
];

// Default scene hierarchy
const defaultSceneObjects: SceneObject[] = [
  {
    id: 'upper-jaw',
    name: 'Upper Jaw',
    type: 'group',
    visible: true,
    color: '#a855f7',
    opacity: 1,
    expanded: true,
    children: []
  },
  {
    id: 'lower-jaw',
    name: 'Lower Jaw',
    type: 'group',
    visible: true,
    color: '#3b82f6',
    opacity: 1,
    expanded: true,
    children: []
  },
  {
    id: 'teeth',
    name: 'Teeth',
    type: 'group',
    visible: true,
    color: '#f5f5dc',
    opacity: 1,
    expanded: true,
    children: [
      { id: 'upper-teeth', name: 'Upper', type: 'mesh', visible: true, color: '#f5f5dc', opacity: 1 },
      { id: 'lower-teeth', name: 'Lower', type: 'mesh', visible: true, color: '#f5f5dc', opacity: 1 },
      { id: 'upper-pulp', name: 'Upper Pulp', type: 'mesh', visible: true, color: '#ef4444', opacity: 0.75 },
      { id: 'lower-pulp', name: 'Lower Pulp', type: 'mesh', visible: true, color: '#ef4444', opacity: 0.75 }
    ]
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    type: 'group',
    visible: true,
    color: '#94a3b8',
    opacity: 0.67,
    expanded: false,
    children: [
      { id: 'soft-tissue', name: 'SoftTissue', type: 'mesh', visible: false, color: '#fca5a5', opacity: 0.6 },
      { id: 'cranial', name: 'Cranial', type: 'mesh', visible: false, color: '#94a3b8', opacity: 0.4 },
      { id: 'sinus', name: 'Sinus', type: 'mesh', visible: true, color: '#60a5fa', opacity: 0.5 },
      { id: 'incisive-canal', name: 'IncisiveCanal', type: 'mesh', visible: true, color: '#fb923c', opacity: 0.8 },
      { id: 'maxilla', name: 'Maxilla', type: 'mesh', visible: true, color: '#a855f7', opacity: 0.75 },
      { id: 'mandible', name: 'Mandible', type: 'mesh', visible: true, color: '#38bdf8', opacity: 0.75 },
      { id: 'mandibular-canal', name: 'Mandibular canal', type: 'mesh', visible: true, color: '#fb923c', opacity: 0.8 },
      { id: 'airways', name: 'Airways', type: 'mesh', visible: false, color: '#6b7280', opacity: 0.4 }
    ]
  },
  {
    id: 'landmarks',
    name: 'Landmarks',
    type: 'group',
    visible: true,
    color: '#06b6d4',
    opacity: 1,
    expanded: false,
    children: [
      { id: 'teeth-landmarks', name: 'Teeth', type: 'landmark', visible: true, color: '#22c55e', opacity: 1 },
      { id: 'cephalometric', name: 'Cephalometric', type: 'landmark', visible: true, color: '#f97316', opacity: 1 }
    ]
  }
];

// STL Model Component
const STLModelWithOpacity = ({ 
  url, color, opacity, visible, wireframe 
}: { 
  url: string; color: string; opacity: number; visible: boolean; wireframe?: boolean;
}) => {
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

// Placeholder cube for demo
const PlaceholderModel = ({ color, opacity, visible }: { color: string; opacity: number; visible: boolean }) => {
  if (!visible) return null;
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial 
        color={color} 
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.4}
      />
    </mesh>
  );
};

// Crosshair overlay component
const CrosshairOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/70" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/70" />
    </div>
  );
};

// Single Viewport Component
const SingleViewport = ({ 
  viewport, 
  isActive, 
  onActivate, 
  sceneObjects, 
  showCrosshair, 
  showGrid, 
  lightIntensity,
  modelUrl,
  wireframe
}: {
  viewport: Viewport;
  isActive: boolean;
  onActivate: () => void;
  sceneObjects: SceneObject[];
  showCrosshair: boolean;
  showGrid: boolean;
  lightIntensity: number;
  modelUrl: string | null;
  wireframe: boolean;
}) => {
  const getCameraProps = () => {
    switch (viewport.camera) {
      case 'axial':
        return { position: [0, 10, 0] as [number, number, number], rotation: [0, 0, 0] };
      case 'coronal':
        return { position: [0, 0, 10] as [number, number, number], rotation: [0, 0, 0] };
      case 'sagittal':
        return { position: [10, 0, 0] as [number, number, number], rotation: [0, 0, 0] };
      default:
        return { position: [5, 5, 5] as [number, number, number], rotation: [0, 0, 0] };
    }
  };

  const cameraProps = getCameraProps();
  
  const getRootOpacity = (objectId: string) => {
    const findObject = (objects: SceneObject[]): SceneObject | undefined => {
      for (const obj of objects) {
        if (obj.id === objectId) return obj;
        if (obj.children) {
          const found = findObject(obj.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const obj = findObject(sceneObjects);
    return obj?.visible ? obj?.opacity ?? 1 : 0;
  };

  return (
    <div 
      className={`relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden cursor-pointer ${
        isActive ? 'ring-2 ring-amber-500' : 'ring-1 ring-border'
      }`}
      onClick={onActivate}
    >
      {/* Viewport Label */}
      <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {viewport.name}
      </div>
      
      {/* Zoom indicator */}
      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {Math.round(viewport.zoom * 100)}%
      </div>

      <CrosshairOverlay show={showCrosshair} />

      <Canvas shadows className="w-full h-full" style={{ minHeight: '200px' }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraProps.position} fov={50} />
          <ambientLight intensity={0.4 * lightIntensity} />
          <directionalLight position={[10, 10, 5]} intensity={lightIntensity} castShadow />
          <directionalLight position={[-10, -10, -5]} intensity={0.3 * lightIntensity} />
          <Environment preset="studio" />

          {showGrid && viewport.camera === 'perspective' && (
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#4a4a4a"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#6a6a6a"
              fadeDistance={20}
              fadeStrength={1}
              infiniteGrid={true}
            />
          )}

          <Center>
            {modelUrl ? (
              <STLModelWithOpacity 
                url={modelUrl} 
                color={sceneObjects[2]?.color || '#f5f5dc'} 
                opacity={getRootOpacity('teeth')} 
                visible={true}
                wireframe={wireframe}
              />
            ) : (
              <PlaceholderModel 
                color={sceneObjects[2]?.color || '#f5f5dc'} 
                opacity={0.9} 
                visible={true} 
              />
            )}
          </Center>

          <OrbitControls 
            enablePan 
            enableZoom 
            enableRotate={viewport.camera === 'perspective'}
            minDistance={2}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Object Tree Item Component
const ObjectTreeItem = ({ 
  object, 
  level = 0,
  onToggleVisibility,
  onChangeColor,
  onChangeOpacity,
  onToggleExpand,
  selectedId,
  onSelect
}: { 
  object: SceneObject; 
  level?: number;
  onToggleVisibility: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onToggleExpand: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const hasChildren = object.children && object.children.length > 0;
  const isSelected = selectedId === object.id;
  const iconClass = object.type === 'landmark' ? Circle : object.type === 'group' ? Folder : Box;
  const Icon = iconClass;

  return (
    <div>
      <div 
        className={`flex items-center gap-1 py-1 px-2 hover:bg-secondary/50 cursor-pointer rounded transition-colors ${
          isSelected ? 'bg-primary/20 text-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(object.id)}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(object.id); }}
            className="p-0.5 hover:bg-secondary rounded"
          >
            {object.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <Icon className="w-4 h-4 text-muted-foreground" />

        {/* Name */}
        <span className="flex-1 text-sm truncate">{object.name}</span>

        {/* Color picker trigger */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
            className="w-4 h-4 rounded border border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: object.color }}
          />
          
          {showColorPicker && (
            <div 
              className="absolute right-0 top-6 z-50 p-3 bg-popover border rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        object.color === color ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => { onChangeColor(object.id, color); setShowColorPicker(false); }}
                    />
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Opacity</span>
                    <span>{Math.round(object.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[object.opacity * 100]}
                    onValueChange={([v]) => onChangeOpacity(object.id, v / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-28"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => setShowColorPicker(false)}
                >
                  + Custom color
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(object.id); }}
          className="p-0.5 hover:bg-secondary rounded"
        >
          {object.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Children */}
      {hasChildren && object.expanded && (
        <div>
          {object.children!.map((child) => (
            <ObjectTreeItem
              key={child.id}
              object={child}
              level={level + 1}
              onToggleVisibility={onToggleVisibility}
              onChangeColor={onChangeColor}
              onChangeOpacity={onChangeOpacity}
              onToggleExpand={onToggleExpand}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export const Dental3DViewer = ({ patientId, patientName }: Dental3DViewerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(defaultSceneObjects);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeViewport, setActiveViewport] = useState<string>('main');
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'objects' | 'anatomy'>('objects');

  // Viewports configuration
  const [viewports] = useState<Viewport[]>([
    { id: 'main', name: 'Main 3D', camera: 'perspective', position: [5, 5, 5], target: [0, 0, 0], zoom: 1 },
    { id: 'axial', name: 'Axial', camera: 'axial', position: [0, 10, 0], target: [0, 0, 0], zoom: 0.75 },
    { id: 'coronal', name: 'Coronal', camera: 'coronal', position: [0, 0, 10], target: [0, 0, 0], zoom: 0.67 },
    { id: 'sagittal', name: 'Sagittal', camera: 'sagittal', position: [10, 0, 0], target: [0, 0, 0], zoom: 0.67 }
  ]);

  // Fetch patient's 3D models
  const { data: cloudModels, refetch: refetchModels } = useQuery({
    queryKey: ['dental-3d-models', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .or('file_name.ilike.%.stl,file_name.ilike.%.ply,file_name.ilike.%.obj')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId
  });

  // Tree manipulation functions
  const updateObjectRecursive = (objects: SceneObject[], id: string, updates: Partial<SceneObject>): SceneObject[] => {
    return objects.map(obj => {
      if (obj.id === id) {
        return { ...obj, ...updates };
      }
      if (obj.children) {
        return { ...obj, children: updateObjectRecursive(obj.children, id, updates) };
      }
      return obj;
    });
  };

  const toggleVisibility = (id: string) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { visible: !findObject(prev, id)?.visible }));
  };

  const changeColor = (id: string, color: string) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { color }));
  };

  const changeOpacity = (id: string, opacity: number) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { opacity }));
  };

  const toggleExpand = (id: string) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { expanded: !findObject(prev, id)?.expanded }));
  };

  const findObject = (objects: SceneObject[], id: string): SceneObject | undefined => {
    for (const obj of objects) {
      if (obj.id === id) return obj;
      if (obj.children) {
        const found = findObject(obj.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'ply', 'obj', 'drc'].includes(extension || '')) {
      toast({ title: "Format not supported", description: "Please upload STL, OBJ, PLY or DRC files", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setModelName(file.name);
      setShowUploadDialog(false);
      toast({ title: "Model loaded", description: file.name });
    } catch (error) {
      toast({ title: "Error", description: "Could not load model", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Export functionality
    toast({ title: "Exporting...", description: "STL files will be downloaded" });
    setShowExportDialog(false);
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Header Toolbar */}
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Move3D className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">3D Dental Viewer</CardTitle>
          {patientName && <Badge variant="secondary">{patientName}</Badge>}
          {modelName && <Badge variant="outline">{modelName}</Badge>}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Grid View */}
          <Button variant="ghost" size="icon" onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
            <Grid3x3 className={`w-4 h-4 ${showGrid ? 'text-primary' : ''}`} />
          </Button>
          
          {/* Crosshair */}
          <Button variant="ghost" size="icon" onClick={() => setShowCrosshair(!showCrosshair)} title="Toggle Crosshair">
            <Crosshair className={`w-4 h-4 ${showCrosshair ? 'text-primary' : ''}`} />
          </Button>
          
          {/* Lighting */}
          <Button variant="ghost" size="icon" onClick={() => setLightIntensity(l => l === 1 ? 1.5 : 1)} title="Toggle Lighting">
            <Sun className={`w-4 h-4 ${lightIntensity > 1 ? 'text-amber-500' : ''}`} />
          </Button>
          
          {/* Objects Tab */}
          <Button 
            variant={sidebarTab === 'objects' ? 'default' : 'ghost'} 
            size="icon" 
            onClick={() => setSidebarTab('objects')}
            title="Objects Panel"
          >
            <Layers className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Upload */}
          <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)} className="gap-1">
            <Upload className="w-4 h-4" />
            Upload 3D
          </Button>

          {/* Export */}
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>

          {/* About */}
          <Button variant="ghost" size="icon" onClick={() => setShowAboutDialog(true)} title="About">
            <Info className="w-4 h-4" />
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          
          {isFullscreen && (
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex h-[calc(100vh-14rem)]" style={{ minHeight: '600px' }}>
          {/* Left Sidebar - Object Hierarchy */}
          <div className="w-72 border-r bg-card flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Objects</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="w-3 h-3" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {sceneObjects.map((object) => (
                  <ObjectTreeItem
                    key={object.id}
                    object={object}
                    onToggleVisibility={toggleVisibility}
                    onChangeColor={changeColor}
                    onChangeOpacity={changeOpacity}
                    onToggleExpand={toggleExpand}
                    selectedId={selectedObjectId}
                    onSelect={setSelectedObjectId}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Cloud models list */}
            {cloudModels && cloudModels.length > 0 && (
              <div className="border-t p-2">
                <span className="text-xs font-medium text-muted-foreground">Patient Models</span>
                <div className="mt-2 space-y-1">
                  {cloudModels.slice(0, 5).map((model: any) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setModelUrl(model.file_url);
                        setModelName(model.file_name);
                      }}
                      className="w-full text-left text-xs p-1.5 rounded hover:bg-secondary truncate"
                    >
                      {model.file_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Viewport Area - 2x2 Grid */}
          <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2 bg-muted/30">
            {viewports.map((viewport) => (
              <SingleViewport
                key={viewport.id}
                viewport={viewport}
                isActive={activeViewport === viewport.id}
                onActivate={() => setActiveViewport(viewport.id)}
                sceneObjects={sceneObjects}
                showCrosshair={showCrosshair}
                showGrid={showGrid}
                lightIntensity={lightIntensity}
                modelUrl={modelUrl}
                wireframe={wireframe}
              />
            ))}
          </div>
        </div>

        {/* Status Bar / Legend */}
        <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>🖱️ Left-click drag: Rotate</span>
            <span>Scroll: Zoom</span>
            <span>Right-click drag: Pan</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Maxilla</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span>Mandible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span>Canal</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload 3D</DialogTitle>
            <DialogDescription>Upload STL, OBJ, PLY or DRC files</DialogDescription>
          </DialogHeader>
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop file or folder here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: STL, OBJ, PLY, DRC
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".stl,.obj,.ply,.drc" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={() => fileInputRef.current?.click()}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export STL files</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <Box className="w-4 h-4" />
              <span>Teeth</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <Layers className="w-4 h-4" />
              <span>Anatomy</span>
            </label>
            <Separator />
            <label className="flex items-center gap-2">
              <input type="radio" name="merge" className="rounded-full" />
              <span>Merge in one file</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onClick={handleExport}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About 3D Dental Viewer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Country</Label>
              <select className="w-full mt-1 border rounded-md p-2">
                <option>Select country</option>
                <option>México</option>
                <option>Estados Unidos</option>
                <option>España</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced 3D dental visualization module for comprehensive treatment planning.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Dental3DViewer;
