import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Upload, 
  Smile, 
  Sparkles, 
  Download,
  RotateCcw,
  Palette,
  Ruler,
  RefreshCw,
  Camera,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimulationSettings {
  whitening: number;
  alignment: number;
  gumContour: number;
  toothSize: number;
}

interface SmileSimulatorProps {
  patientId?: string;
  patientName?: string;
}

export const SmileSimulator = ({ patientId, patientName }: SmileSimulatorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<SimulationSettings>({
    whitening: 50,
    alignment: 50,
    gumContour: 50,
    toothSize: 50
  });
  const [selectedPreset, setSelectedPreset] = useState<string>("natural");

  const presets = [
    { id: "natural", name: "Natural", description: "Mejora sutil y natural" },
    { id: "hollywood", name: "Hollywood", description: "Blanqueamiento intenso" },
    { id: "celebrity", name: "Celebridad", description: "Sonrisa perfecta" },
    { id: "subtle", name: "Sutil", description: "Cambios mínimos" }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona una imagen.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setSimulatedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    switch (presetId) {
      case "natural":
        setSettings({ whitening: 40, alignment: 30, gumContour: 20, toothSize: 50 });
        break;
      case "hollywood":
        setSettings({ whitening: 90, alignment: 70, gumContour: 60, toothSize: 60 });
        break;
      case "celebrity":
        setSettings({ whitening: 80, alignment: 90, gumContour: 70, toothSize: 55 });
        break;
      case "subtle":
        setSettings({ whitening: 20, alignment: 15, gumContour: 10, toothSize: 50 });
        break;
    }
  };

  const generateSimulation = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      // Simulating AI processing - in real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, we'll apply a filter effect
      // In production, this would use AI image generation
      setSimulatedImage(originalImage);
      
      toast({
        title: "Simulación completada",
        description: "La proyección de sonrisa ha sido generada."
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Error en la simulación",
        description: "No se pudo generar la simulación. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!simulatedImage) return;
    
    const link = document.createElement('a');
    link.href = simulatedImage;
    link.download = `simulacion-sonrisa-${patientName || 'paciente'}-${Date.now()}.png`;
    link.click();
  };

  const resetAll = () => {
    setOriginalImage(null);
    setSimulatedImage(null);
    setSettings({ whitening: 50, alignment: 50, gumContour: 50, toothSize: 50 });
    setSelectedPreset("natural");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-primary" />
          Simulador de Sonrisas
        </CardTitle>
        <CardDescription>
          Crea proyecciones realistas del resultado del tratamiento con IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {!originalImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Sube una foto de la sonrisa
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Para mejores resultados, usa una foto frontal con buena iluminación
            </p>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Foto
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Image Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Original</Label>
                <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={resetAll}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Simulación</Label>
                <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
                  {simulatedImage ? (
                    <>
                      <img
                        src={simulatedImage}
                        alt="Simulación"
                        className="w-full h-full object-cover"
                        style={{
                          filter: `brightness(${1 + settings.whitening / 200}) contrast(${1 + settings.alignment / 400})`
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <Button size="icon" variant="secondary" onClick={downloadResult}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground p-8">
                      {isProcessing ? (
                        <div className="space-y-4">
                          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                          <p>Generando simulación con IA...</p>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p>Ajusta los parámetros y genera la simulación</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Presets de Estilo</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset === preset.id ? "default" : "outline"}
                    className="h-auto py-3 flex-col"
                    onClick={() => applyPreset(preset.id)}
                  >
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs opacity-70">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Adjustment Sliders */}
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="advanced">Avanzado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Blanqueamiento
                      </Label>
                      <span className="text-sm text-muted-foreground">{settings.whitening}%</span>
                    </div>
                    <Slider
                      value={[settings.whitening]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, whitening: value }))}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Alineación
                      </Label>
                      <span className="text-sm text-muted-foreground">{settings.alignment}%</span>
                    </div>
                    <Slider
                      value={[settings.alignment]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, alignment: value }))}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Contorno de Encías</Label>
                      <span className="text-sm text-muted-foreground">{settings.gumContour}%</span>
                    </div>
                    <Slider
                      value={[settings.gumContour]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, gumContour: value }))}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Tamaño de Dientes</Label>
                      <span className="text-sm text-muted-foreground">{settings.toothSize}%</span>
                    </div>
                    <Slider
                      value={[settings.toothSize]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, toothSize: value }))}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={generateSimulation}
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar Simulación
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSettings({ whitening: 50, alignment: 50, gumContour: 50, toothSize: 50 });
                  setSelectedPreset("natural");
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">💡 Tips para mejores resultados</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Usa fotos con buena iluminación natural</li>
                <li>• Asegúrate de que los dientes sean visibles en la foto</li>
                <li>• Evita fotos borrosas o con filtros</li>
                <li>• Toma la foto de frente para mejores resultados</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
