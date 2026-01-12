import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PenTool, 
  FileCheck, 
  Download, 
  Trash2, 
  RotateCcw, 
  Save,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Shield,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DigitalSignatureProps {
  patientId?: string;
  patientName?: string;
  documentType?: string;
  documentContent?: string;
  onSignComplete?: (signatureData: string) => void;
}

interface SignedDocument {
  id: string;
  patient_id: string;
  document_type: string;
  document_content: string;
  signature_data: string;
  signed_at: string;
  signer_name: string;
  signer_ip?: string;
  document_hash?: string;
}

const documentTemplates = [
  {
    id: "consent-general",
    name: "Consentimiento General",
    content: `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DENTAL

Yo, _________________________, identificado(a) con documento de identidad número _________________________, 
declaro que:

1. He sido informado(a) de manera clara y comprensible sobre el diagnóstico, pronóstico y las diferentes 
   alternativas de tratamiento disponibles para mi condición dental.

2. Entiendo los riesgos, beneficios y posibles complicaciones asociadas al tratamiento propuesto.

3. He tenido la oportunidad de hacer preguntas y todas han sido respondidas a mi satisfacción.

4. Autorizo al profesional de salud oral y su equipo a realizar el tratamiento dental acordado.

5. Entiendo que puedo retirar mi consentimiento en cualquier momento.

Firma del Paciente: _________________________ 
Fecha: _________________________
`
  },
  {
    id: "consent-extraction",
    name: "Consentimiento Extracción",
    content: `CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTAL

Yo, _________________________, autorizo la extracción del/los diente(s): _________________________

Entiendo que los riesgos incluyen pero no se limitan a:
- Dolor e inflamación postoperatoria
- Sangrado prolongado
- Infección
- Daño a dientes adyacentes
- Fractura de raíz
- Comunicación oroantral (en caso de molares superiores)
- Parestesia temporal o permanente

He sido informado(a) de las alternativas y acepto proceder con la extracción.

Firma del Paciente: _________________________
Fecha: _________________________
`
  },
  {
    id: "consent-endodontics",
    name: "Consentimiento Endodoncia",
    content: `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE CONDUCTO

Yo, _________________________, autorizo el tratamiento de conducto en el diente: _________________________

Entiendo que:
- El tratamiento tiene una alta tasa de éxito pero no está garantizado al 100%
- Puede requerir múltiples citas
- El diente necesitará una restauración posterior (corona)
- Existe riesgo de fractura de instrumentos, perforación o fracaso del tratamiento

Firma del Paciente: _________________________
Fecha: _________________________
`
  },
  {
    id: "consent-orthodontics",
    name: "Consentimiento Ortodoncia",
    content: `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE ORTODONCIA

Yo, _________________________, autorizo el inicio del tratamiento de ortodoncia.

Entiendo que:
- La duración estimada del tratamiento es de _____ meses/años
- Debo asistir a las citas de control regularmente
- Debo mantener excelente higiene oral durante el tratamiento
- Pueden ocurrir descalcificación, caries o enfermedad periodontal
- Puede haber recidiva después del tratamiento
- Debo usar retenedores después del tratamiento activo

Firma del Paciente/Tutor: _________________________
Fecha: _________________________
`
  },
  {
    id: "consent-implant",
    name: "Consentimiento Implante",
    content: `CONSENTIMIENTO INFORMADO PARA COLOCACIÓN DE IMPLANTE DENTAL

Yo, _________________________, autorizo la colocación de implante(s) dental(es).

Entiendo los riesgos incluyendo:
- Infección, sangrado, inflamación
- Daño a nervios (parestesia)
- Fracaso de osteointegración
- Rechazo del implante
- Necesidad de procedimientos adicionales (injertos)
- Daño a estructuras adyacentes

Firma del Paciente: _________________________
Fecha: _________________________
`
  }
];

export const DigitalSignature = ({
  patientId,
  patientName,
  documentType,
  documentContent,
  onSignComplete
}: DigitalSignatureProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [signerName, setSignerName] = useState(patientName || "");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customContent, setCustomContent] = useState(documentContent || "");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<SignedDocument | null>(null);

  // Fetch signed documents
  const { data: signedDocuments = [], isLoading } = useQuery({
    queryKey: ['signed-documents', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('document_type', 'signed_consent')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId
  });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [showSignDialog]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  };

  const generateHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const saveSignedDocument = useMutation({
    mutationFn: async () => {
      if (!patientId || !signatureData || !signerName) {
        throw new Error("Datos incompletos");
      }

      const docContent = selectedTemplate 
        ? documentTemplates.find(t => t.id === selectedTemplate)?.content 
        : customContent;
      
      if (!docContent) throw new Error("Documento sin contenido");

      const hash = await generateHash(docContent + signatureData + new Date().toISOString());

      // Create a combined document with content and signature
      const signedDoc = {
        content: docContent,
        signature: signatureData,
        signer: signerName,
        signedAt: new Date().toISOString(),
        hash
      };

      const { error } = await supabase.from('patient_documents').insert({
        patient_id: patientId,
        document_type: 'signed_consent',
        file_name: `consent_${selectedTemplate || 'custom'}_${Date.now()}.json`,
        file_url: `data:application/json;base64,${btoa(JSON.stringify(signedDoc))}`,
        description: `Consentimiento firmado: ${documentTemplates.find(t => t.id === selectedTemplate)?.name || 'Personalizado'}`,
        mime_type: 'application/json'
      });

      if (error) throw error;
      return signedDoc;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signed-documents', patientId] });
      toast({ title: "Documento firmado", description: "El consentimiento ha sido guardado correctamente" });
      setShowSignDialog(false);
      clearSignature();
      setSelectedTemplate("");
      setCustomContent("");
      if (onSignComplete) {
        onSignComplete(data.signature);
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "No se pudo guardar el documento",
        variant: "destructive" 
      });
    }
  });

  const downloadDocument = (doc: any) => {
    try {
      const docData = JSON.parse(atob(doc.file_url.split(',')[1]));
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${doc.description}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; line-height: 1.6; }
            .signature-section { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
            .signature img { max-width: 300px; border: 1px solid #ccc; }
            .metadata { color: #666; font-size: 12px; margin-top: 20px; }
            .hash { font-family: monospace; font-size: 10px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NovellDent - Documento Firmado Digitalmente</h1>
          </div>
          <div class="content">${docData.content}</div>
          <div class="signature-section">
            <h3>Firma Digital</h3>
            <p><strong>Firmante:</strong> ${docData.signer}</p>
            <p><strong>Fecha:</strong> ${format(new Date(docData.signedAt), "PPpp", { locale: es })}</p>
            <div class="signature">
              <img src="${docData.signature}" alt="Firma digital" />
            </div>
          </div>
          <div class="metadata">
            <p><strong>Hash del documento:</strong></p>
            <p class="hash">${docData.hash}</p>
            <p>Este documento ha sido firmado electrónicamente y tiene validez legal.</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.file_name.replace('.json', '')}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo descargar el documento", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5 text-primary" />
          Firma Digital y Consentimientos
        </CardTitle>
        {patientId && (
          <Button onClick={() => setShowSignDialog(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Nuevo Documento
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Templates Section */}
        {!patientId && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Selecciona un paciente para gestionar consentimientos</p>
          </div>
        )}

        {patientId && (
          <>
            {/* Document Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {documentTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 border border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setShowSignDialog(true);
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">Plantilla</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Signed Documents */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-500" />
                Documentos Firmados
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : signedDocuments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay documentos firmados
                </p>
              ) : (
                <div className="space-y-3">
                  {signedDocuments.map((doc: any) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          Firmado
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Sign Dialog */}
        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                {selectedTemplate 
                  ? documentTemplates.find(t => t.id === selectedTemplate)?.name 
                  : "Documento Personalizado"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Document Content */}
              <div className="space-y-2">
                <Label>Contenido del Documento</Label>
                <Textarea
                  value={selectedTemplate 
                    ? documentTemplates.find(t => t.id === selectedTemplate)?.content 
                    : customContent}
                  onChange={(e) => !selectedTemplate && setCustomContent(e.target.value)}
                  readOnly={!!selectedTemplate}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Escriba el contenido del documento..."
                />
              </div>

              {/* Signer Name */}
              <div className="space-y-2">
                <Label>Nombre del Firmante</Label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Firma Digital</Label>
                  <Button variant="ghost" size="sm" onClick={clearSignature} className="gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </Button>
                </div>
                <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dibuje su firma con el mouse o toque en dispositivos táctiles
                </p>
              </div>

              {/* Legal Notice */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Aviso Legal</p>
                    <p className="text-amber-600 dark:text-amber-300/70">
                      Al firmar este documento, acepto que mi firma digital tiene la misma validez 
                      legal que una firma manuscrita. El documento será almacenado de forma segura 
                      con un hash criptográfico para garantizar su integridad.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => saveSignedDocument.mutate()}
                disabled={!signatureData || !signerName || saveSignedDocument.isPending}
                className="gap-2"
              >
                {saveSignedDocument.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Firmar y Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
