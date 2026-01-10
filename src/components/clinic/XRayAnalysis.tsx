import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Upload, 
  Scan, 
  FileImage, 
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  findings: string[];
  recommendations: string[];
  urgency: "low" | "medium" | "high";
  summary: string;
}

interface XRayAnalysisProps {
  patientId?: string;
  patientName?: string;
}

export const XRayAnalysis = ({ patientId, patientName }: XRayAnalysisProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona una imagen de rayos X.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const analyzeXRay = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('dental-ai-assistant', {
        body: {
          messages: [
            {
              role: "user",
              content: `Analiza esta radiografía dental y proporciona:
1. Hallazgos principales (lista)
2. Recomendaciones de tratamiento (lista)
3. Nivel de urgencia (bajo/medio/alto)
4. Resumen breve

${additionalNotes ? `Notas adicionales del doctor: ${additionalNotes}` : ''}
${patientName ? `Paciente: ${patientName}` : ''}

Responde en formato JSON con: findings (array), recommendations (array), urgency (string), summary (string)`
            }
          ],
          imageBase64: selectedImage.split(',')[1],
          context: "xray_analysis"
        }
      });

      if (response.error) throw response.error;

      // Parse AI response
      try {
        const parsed = JSON.parse(response.data.response);
        setAnalysisResult({
          findings: parsed.findings || [],
          recommendations: parsed.recommendations || [],
          urgency: parsed.urgency || "low",
          summary: parsed.summary || "Análisis completado"
        });
      } catch {
        // Fallback if not JSON
        setAnalysisResult({
          findings: [response.data.response],
          recommendations: ["Consultar con especialista"],
          urgency: "medium",
          summary: "Análisis completado - revisar hallazgos"
        });
      }

      toast({
        title: "Análisis completado",
        description: "La radiografía ha sido analizada exitosamente."
      });
    } catch (error) {
      console.error('XRay analysis error:', error);
      toast({
        title: "Error en el análisis",
        description: "No se pudo analizar la imagen. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setAdditionalNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "high":
        return { color: "bg-red-100 text-red-700 border-red-300", icon: AlertTriangle, label: "Alta Urgencia" };
      case "medium":
        return { color: "bg-amber-100 text-amber-700 border-amber-300", icon: Info, label: "Urgencia Media" };
      default:
        return { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle, label: "Baja Urgencia" };
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          Análisis de Radiografías con IA
        </CardTitle>
        <CardDescription>
          Sube una radiografía dental para obtener un análisis automático asistido por IA
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

        {!selectedImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Arrastra una imagen o haz clic para subir
            </h3>
            <p className="text-muted-foreground text-sm">
              Formatos soportados: JPG, PNG, DICOM
            </p>
            <Button className="mt-4" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Archivo
            </Button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                <img
                  src={selectedImage}
                  alt="Radiografía"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={clearAll}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Notas adicionales para el análisis (opcional)..."
                className="min-h-[100px]"
              />

              <Button
                onClick={analyzeXRay}
                disabled={isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Analizar Radiografía
                  </>
                )}
              </Button>
            </motion.div>

            {/* Analysis Results */}
            <AnimatePresence mode="wait">
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <ScrollArea className="h-[500px] pr-4">
                    {/* Urgency Badge */}
                    <div className="mb-4">
                      {(() => {
                        const config = getUrgencyConfig(analysisResult.urgency);
                        return (
                          <Badge className={`${config.color} gap-1`}>
                            <config.icon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Summary */}
                    <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-foreground mb-2">Resumen</h4>
                      <p className="text-muted-foreground text-sm">{analysisResult.summary}</p>
                    </div>

                    {/* Findings */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-foreground mb-2">Hallazgos</h4>
                      <ul className="space-y-2">
                        {analysisResult.findings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Recomendaciones</h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Guardar en Historial
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Exportar PDF
                    </Button>
                  </div>
                </motion.div>
              )}

              {!analysisResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="text-center text-muted-foreground">
                    <Scan className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Haz clic en "Analizar" para obtener resultados</p>
                  </div>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Procesando imagen con IA...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
