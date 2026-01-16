import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileCheck, Plus, Eye, XCircle, Printer, PenTool,
  Loader2, Check, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientConsentsSectionProps {
  patientId: string;
  patientName: string;
}

export const PatientConsentsSection = ({ patientId, patientName }: PatientConsentsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showCancelled, setShowCancelled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [viewConsent, setViewConsent] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [consentType, setConsentType] = useState("");
  const [consentContent, setConsentContent] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentConsentId, setCurrentConsentId] = useState<string | null>(null);

  // Fetch consents
  const { data: consents = [], isLoading } = useQuery({
    queryKey: ['patient-consents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch consent templates
  const { data: templates = [] } = useQuery({
    queryKey: ['consent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', 'consent')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }
  });

  // Create consent mutation
  const createConsent = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('patient_consents').insert({
        patient_id: patientId,
        consent_type: consentType,
        content: consentContent,
        template_id: selectedTemplate || null
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-consents', patientId] });
      toast({ title: "Consentimiento creado" });
      setDialogOpen(false);
      setCurrentConsentId(data.id);
      setSignDialogOpen(true);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Sign consent mutation
  const signConsent = useMutation({
    mutationFn: async (signatureData: string) => {
      if (!currentConsentId) throw new Error("No consent selected");
      
      // Upload signature image
      const base64Data = signatureData.split(',')[1];
      const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: 'image/png' });
      const fileName = `${patientId}/signatures/${currentConsentId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Update consent with signature
      const { error } = await supabase
        .from('patient_consents')
        .update({
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          signature_url: fileName
        })
        .eq('id', currentConsentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-consents', patientId] });
      toast({ title: "Consentimiento firmado" });
      setSignDialogOpen(false);
      setCurrentConsentId(null);
      clearCanvas();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Cancel consent
  const cancelConsent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_consents')
        .update({ 
          is_cancelled: true, 
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-consents', patientId] });
      toast({ title: "Consentimiento anulado" });
    }
  });

  const resetForm = () => {
    setSelectedTemplate("");
    setConsentType("");
    setConsentContent("");
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setConsentType(template.name);
      // Replace placeholders
      let content = template.content;
      content = content.replace('{{patient_name}}', patientName);
      content = content.replace('{{date}}', format(new Date(), "d 'de' MMMM, yyyy", { locale: es }));
      setConsentContent(content);
    }
    setSelectedTemplate(templateId);
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    signConsent.mutate(signatureData);
  };

  const printConsent = (consent: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Consentimiento - ${patientName}</title></head>
          <body>
            ${consent.content}
            ${consent.signature_data ? `
              <div style="margin-top: 40px;">
                <p>Firma:</p>
                <img src="${consent.signature_data}" style="max-width: 300px; border-bottom: 1px solid black;" />
                <p>Fecha de firma: ${format(new Date(consent.signed_at), "d 'de' MMMM, yyyy", { locale: es })}</p>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredConsents = consents.filter((c: any) => {
    if (!showCancelled && c.is_cancelled) return false;
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Consentimientos Informados
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-cancelled-consents"
                  checked={showCancelled}
                  onCheckedChange={setShowCancelled}
                />
                <Label htmlFor="show-cancelled-consents" className="text-sm">Mostrar anulados</Label>
              </div>

              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Consentimiento
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConsents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Este paciente no cuenta con ningún consentimiento informado creado en la plataforma</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Crear primer consentimiento
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {filteredConsents.map((consent: any) => (
                  <Card 
                    key={consent.id}
                    className={cn(
                      "transition-colors",
                      consent.is_cancelled && "opacity-60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{consent.consent_type}</h4>
                            {consent.signed_at ? (
                              <Badge className="bg-green-500/10 text-green-600">
                                <Check className="w-3 h-3 mr-1" /> Firmado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pendiente de firma</Badge>
                            )}
                            {consent.is_cancelled && (
                              <Badge variant="destructive">Anulado</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            Creado: {format(new Date(consent.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                          {consent.signed_at && (
                            <p className="text-sm text-muted-foreground">
                              Firmado: {format(new Date(consent.signed_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setViewConsent(consent)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!consent.signed_at && !consent.is_cancelled && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setCurrentConsentId(consent.id);
                                setSignDialogOpen(true);
                              }}
                            >
                              <PenTool className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => printConsent(consent)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {!consent.is_cancelled && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => cancelConsent.mutate(consent.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Consent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Consentimiento Informado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Plantilla</Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Consentimiento</Label>
              <Select value={consentType} onValueChange={setConsentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Consentimiento General</SelectItem>
                  <SelectItem value="surgical">Consentimiento Quirúrgico</SelectItem>
                  <SelectItem value="orthodontics">Consentimiento Ortodoncia</SelectItem>
                  <SelectItem value="endodontics">Consentimiento Endodoncia</SelectItem>
                  <SelectItem value="implants">Consentimiento Implantes</SelectItem>
                  <SelectItem value="bleaching">Consentimiento Blanqueamiento</SelectItem>
                  <SelectItem value="privacy">Aviso de Privacidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contenido</Label>
              <Textarea
                value={consentContent}
                onChange={(e) => setConsentContent(e.target.value)}
                placeholder="Contenido del consentimiento..."
                rows={15}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createConsent.mutate()}
              disabled={!consentType || !consentContent || createConsent.isPending}
            >
              {createConsent.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</>
              ) : (
                'Crear y Firmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma Digital</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Dibuje su firma en el recuadro inferior
            </p>
            
            <div className="border-2 border-dashed rounded-lg p-2 bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            <Button variant="outline" onClick={clearCanvas} className="w-full">
              Limpiar firma
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSignDialogOpen(false); clearCanvas(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={saveSignature}
              disabled={signConsent.isPending}
            >
              {signConsent.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                <><PenTool className="w-4 h-4 mr-2" /> Guardar Firma</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Consent Dialog */}
      <Dialog open={!!viewConsent} onOpenChange={() => setViewConsent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewConsent?.consent_type}</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: viewConsent?.content || '' }}
          />
          {viewConsent?.signature_data && (
            <div className="mt-4 p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Firma:</p>
              <img 
                src={viewConsent.signature_data} 
                alt="Firma" 
                className="max-w-xs border-b border-black"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Firmado el {format(new Date(viewConsent.signed_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewConsent(null)}>
              Cerrar
            </Button>
            <Button onClick={() => printConsent(viewConsent)}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
