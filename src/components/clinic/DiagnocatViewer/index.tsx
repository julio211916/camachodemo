import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Ruler, PenTool } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { SceneObject, Viewport, ExportOptions, DEFAULT_SCENE_HIERARCHY, DEFAULT_VIEWPORTS } from "./types";
import { ObjectTree } from "./ObjectTree";
import { ViewportCanvas } from "./ViewportCanvas";
import { Toolbar } from "./Toolbar";
import { UploadDialog, ExportDialog, AboutDialog } from "./Dialogs";
import { MeasurementTools, MeasurementOverlay, Measurement, Annotation } from "./MeasurementTools";

interface DiagnocatViewerProps {
  patientId?: string;
  patientName?: string;
  onClose?: () => void;
}

export const DiagnocatViewer = ({ patientId, patientName, onClose }: DiagnocatViewerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scene state
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(DEFAULT_SCENE_HIERARCHY);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeViewport, setActiveViewport] = useState<string>('main');
  const [fullscreenViewport, setFullscreenViewport] = useState<string | null>(null);

  // Toolbar state
  const [gridEnabled, setGridEnabled] = useState(true);
  const [crosshairEnabled, setCrosshairEnabled] = useState(false);
  const [lightingIntensity, setLightingIntensity] = useState(1);
  const [objectsPanelOpen, setObjectsPanelOpen] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Model state
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'stl' | 'ply' | 'obj'>('stl');
  const [modelName, setModelName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Measurement & Annotation state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeMeasurementTool, setActiveMeasurementTool] = useState<'select' | 'measure-distance' | 'measure-angle' | 'annotate-point' | 'annotate-text' | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'objects' | 'measurements'>('objects');

  // Measurement handlers
  const handleAddMeasurement = (measurement: Omit<Measurement, 'id' | 'createdAt'>) => {
    const newMeasurement: Measurement = {
      ...measurement,
      id: `m-${Date.now()}`,
      createdAt: new Date()
    };
    setMeasurements(prev => [...prev, newMeasurement]);
  };

  const handleUpdateMeasurement = (id: string, updates: Partial<Measurement>) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const handleAddAnnotation = (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `a-${Date.now()}`,
      createdAt: new Date()
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    setMeasurements([]);
    setAnnotations([]);
  };

  // Fetch patient models
  const { data: cloudModels, refetch: refetchModels } = useQuery({
    queryKey: ['diagnocat-models', patientId],
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
    enabled: !!patientId,
  });

  // Tree manipulation
  const updateObjectRecursive = (objects: SceneObject[], id: string, updates: Partial<SceneObject>): SceneObject[] => {
    return objects.map(obj => {
      if (obj.id === id) return { ...obj, ...updates };
      if (obj.children) return { ...obj, children: updateObjectRecursive(obj.children, id, updates) };
      return obj;
    });
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

  const toggleVisibility = (id: string) => {
    const obj = findObject(sceneObjects, id);
    setSceneObjects(prev => updateObjectRecursive(prev, id, { visible: !obj?.visible }));
  };

  const toggleExpand = (id: string) => {
    const obj = findObject(sceneObjects, id);
    setSceneObjects(prev => updateObjectRecursive(prev, id, { expanded: !obj?.expanded }));
  };

  const changeColor = (id: string, color: string) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { color }));
  };

  const changeOpacity = (id: string, opacity: number) => {
    setSceneObjects(prev => updateObjectRecursive(prev, id, { opacity }));
  };

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'ply', 'obj', 'drc'].includes(extension || '')) {
      toast({ title: "Formato no soportado", description: "Use archivos STL, OBJ, PLY o DRC", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setModelType((extension === 'drc' ? 'stl' : extension) as 'stl' | 'ply' | 'obj');
      setModelName(file.name);
      setShowUploadDialog(false);

      // Save to Supabase if patient context
      if (patientId) {
        const fileName = `${patientId}/models/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('patient-files').upload(fileName, file);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('patient-files').getPublicUrl(fileName);
          await supabase.from('patient_documents').insert({
            patient_id: patientId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            document_type: '3d-model',
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
          });
          refetchModels();
        }
      }

      toast({ title: "Modelo cargado", description: file.name });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el modelo", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [patientId, toast, refetchModels]);

  const handleExport = (options: ExportOptions) => {
    toast({ title: "Exportando...", description: `Formato: ${options.format.toUpperCase()}` });
    if (modelUrl) window.open(modelUrl, '_blank');
  };

  const loadCloudModel = (doc: any) => {
    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    setModelUrl(doc.file_url);
    setModelType((ext === 'drc' ? 'stl' : ext) as 'stl' | 'ply' | 'obj');
    setModelName(doc.file_name);
    toast({ title: "Modelo cargado", description: doc.file_name });
  };

  const viewports = DEFAULT_VIEWPORTS;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''} flex flex-col`}>
      <Toolbar
        patientName={patientName}
        modelName={modelName}
        gridEnabled={gridEnabled}
        crosshairEnabled={crosshairEnabled}
        lightingIntensity={lightingIntensity}
        objectsPanelOpen={objectsPanelOpen}
        wireframe={wireframe}
        autoRotate={autoRotate}
        isFullscreen={isFullscreen}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onToggleCrosshair={() => setCrosshairEnabled(!crosshairEnabled)}
        onChangeLighting={setLightingIntensity}
        onToggleObjectsPanel={() => setObjectsPanelOpen(!objectsPanelOpen)}
        onToggleWireframe={() => setWireframe(!wireframe)}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onUpload={() => setShowUploadDialog(true)}
        onExport={() => setShowExportDialog(true)}
        onAbout={() => setShowAboutDialog(true)}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      <CardContent className="p-0 flex-1">
        <div className="flex h-[calc(100vh-16rem)]" style={{ minHeight: '550px' }}>
          {/* Sidebar */}
          <AnimatePresence>
            {objectsPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r bg-card flex flex-col overflow-hidden"
              >
                <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="flex-1 flex flex-col">
                  <TabsList className="w-full rounded-none border-b justify-start h-10 bg-transparent p-0">
                    <TabsTrigger value="objects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary flex gap-1.5 px-4">
                      <Settings className="w-3.5 h-3.5" />
                      Objetos
                    </TabsTrigger>
                    <TabsTrigger value="measurements" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary flex gap-1.5 px-4">
                      <Ruler className="w-3.5 h-3.5" />
                      Medidas
                      {measurements.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{measurements.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="objects" className="flex-1 mt-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1">
                      <ObjectTree
                        objects={sceneObjects}
                        selectedId={selectedObjectId}
                        onSelect={setSelectedObjectId}
                        onToggleVisibility={toggleVisibility}
                        onToggleExpand={toggleExpand}
                        onChangeColor={changeColor}
                        onChangeOpacity={changeOpacity}
                      />
                    </ScrollArea>

                    {cloudModels && cloudModels.length > 0 && (
                      <div className="border-t p-2">
                        <span className="text-xs font-medium text-muted-foreground">Modelos del Paciente</span>
                        <div className="mt-2 space-y-1 max-h-32 overflow-auto">
                          {cloudModels.map((model: any) => (
                            <button
                              key={model.id}
                              onClick={() => loadCloudModel(model)}
                              className="w-full text-left text-xs p-1.5 rounded hover:bg-secondary truncate"
                            >
                              {model.file_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="measurements" className="flex-1 mt-0 overflow-hidden">
                    <MeasurementTools
                      measurements={measurements}
                      annotations={annotations}
                      activeTool={activeMeasurementTool}
                      onToolChange={setActiveMeasurementTool}
                      onAddMeasurement={handleAddMeasurement}
                      onUpdateMeasurement={handleUpdateMeasurement}
                      onDeleteMeasurement={handleDeleteMeasurement}
                      onAddAnnotation={handleAddAnnotation}
                      onUpdateAnnotation={handleUpdateAnnotation}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      onClearAll={handleClearAll}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Viewports Grid */}
          <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2 bg-muted/30">
            {viewports.map((viewport) => (
              <ViewportCanvas
                key={viewport.id}
                viewport={viewport}
                isActive={activeViewport === viewport.id}
                onActivate={() => setActiveViewport(viewport.id)}
                onFullscreen={() => setFullscreenViewport(viewport.id)}
                showCrosshair={crosshairEnabled}
                showGrid={gridEnabled}
                lightIntensity={lightingIntensity}
                modelUrl={modelUrl}
                modelType={modelType}
                sceneObjects={sceneObjects}
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>🖱️ Arrastrar: Rotar</span>
            <span>Scroll: Zoom</span>
            <span>Clic derecho: Desplazar</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" />Maxila</Badge>
            <Badge variant="outline" className="gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" />Mandíbula</Badge>
            <Badge variant="outline" className="gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" />Canal</Badge>
          </div>
        </div>
      </CardContent>

      {/* Dialogs */}
      <UploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} onFileSelect={handleFileSelect} isLoading={isLoading} />
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} onExport={handleExport} />
      <AboutDialog open={showAboutDialog} onOpenChange={setShowAboutDialog} />
    </Card>
  );
};

export default DiagnocatViewer;
