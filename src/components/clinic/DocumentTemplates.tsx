import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Printer, 
  Download,
  Edit,
  Trash2,
  Copy,
  CheckSquare,
  FileSignature,
  ClipboardList,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  createdAt: Date;
}

const defaultTemplates: Template[] = [
  {
    id: "consent-general",
    name: "Consentimiento Informado General",
    category: "consent",
    content: `CONSENTIMIENTO INFORMADO

Yo, {{PATIENT_NAME}}, con documento de identidad {{PATIENT_ID}}, declaro que:

1. He sido informado(a) de manera clara y comprensible sobre el procedimiento dental que se me realizará.
2. He tenido la oportunidad de hacer preguntas y estas han sido respondidas satisfactoriamente.
3. Comprendo los riesgos y beneficios del tratamiento propuesto.
4. Autorizo al Dr./Dra. {{DOCTOR_NAME}} y su equipo a realizar el procedimiento.

Tratamiento a realizar: {{TREATMENT}}

Riesgos posibles:
- Dolor o molestias postoperatorias
- Sangrado
- Infección
- Reacciones a la anestesia

Declaro que la información proporcionada sobre mi historial médico es verídica.

Fecha: {{DATE}}
Firma del Paciente: _________________________
Firma del Doctor: _________________________`,
    variables: ["PATIENT_NAME", "PATIENT_ID", "DOCTOR_NAME", "TREATMENT", "DATE"],
    createdAt: new Date(),
  },
  {
    id: "consent-extraction",
    name: "Consentimiento para Extracción Dental",
    category: "consent",
    content: `CONSENTIMIENTO PARA EXTRACCIÓN DENTAL

Paciente: {{PATIENT_NAME}}
Fecha: {{DATE}}
Pieza dental: {{TOOTH_NUMBER}}

Yo, el/la paciente arriba mencionado(a), autorizo la extracción de la(s) pieza(s) dental(es) indicada(s).

He sido informado(a) sobre:
- El procedimiento de extracción
- Los cuidados postoperatorios
- Las posibles complicaciones

INSTRUCCIONES POSTOPERATORIAS:
1. No enjuagarse durante las primeras 24 horas
2. Aplicar hielo en la zona durante las primeras horas
3. Dieta blanda y fría
4. No fumar ni consumir alcohol
5. Tomar la medicación prescrita

Doctor: {{DOCTOR_NAME}}

____________________    ____________________
Firma Paciente           Firma Doctor`,
    variables: ["PATIENT_NAME", "DATE", "TOOTH_NUMBER", "DOCTOR_NAME"],
    createdAt: new Date(),
  },
  {
    id: "treatment-plan",
    name: "Plan de Tratamiento",
    category: "treatment",
    content: `PLAN DE TRATAMIENTO DENTAL

Paciente: {{PATIENT_NAME}}
Fecha: {{DATE}}
Doctor: {{DOCTOR_NAME}}

DIAGNÓSTICO:
{{DIAGNOSIS}}

TRATAMIENTOS RECOMENDADOS:
{{TREATMENTS}}

PRESUPUESTO ESTIMADO:
{{BUDGET}}

DURACIÓN ESTIMADA DEL TRATAMIENTO:
{{DURATION}}

NOTAS ADICIONALES:
{{NOTES}}

Este plan de tratamiento ha sido explicado y aceptado por el paciente.

____________________    ____________________
Firma Paciente           Firma Doctor`,
    variables: ["PATIENT_NAME", "DATE", "DOCTOR_NAME", "DIAGNOSIS", "TREATMENTS", "BUDGET", "DURATION", "NOTES"],
    createdAt: new Date(),
  },
  {
    id: "referral",
    name: "Carta de Referencia",
    category: "referral",
    content: `CARTA DE REFERENCIA

Fecha: {{DATE}}

Estimado(a) Dr./Dra. {{SPECIALIST_NAME}}:

Por medio de la presente, refiero al paciente {{PATIENT_NAME}} para evaluación y tratamiento especializado.

MOTIVO DE REFERENCIA:
{{REASON}}

DIAGNÓSTICO ACTUAL:
{{DIAGNOSIS}}

TRATAMIENTOS REALIZADOS:
{{TREATMENTS_DONE}}

ESTUDIOS ADJUNTOS:
{{STUDIES}}

Agradezco de antemano su atención.

Atentamente,
Dr./Dra. {{DOCTOR_NAME}}
NovellDent
Tel: +52 322 183 7666`,
    variables: ["DATE", "SPECIALIST_NAME", "PATIENT_NAME", "REASON", "DIAGNOSIS", "TREATMENTS_DONE", "STUDIES", "DOCTOR_NAME"],
    createdAt: new Date(),
  },
];

const categoryConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  consent: { icon: FileSignature, color: "text-blue-500", label: "Consentimiento" },
  treatment: { icon: ClipboardList, color: "text-green-500", label: "Tratamiento" },
  referral: { icon: FileText, color: "text-purple-500", label: "Referencia" },
  other: { icon: FileText, color: "text-gray-500", label: "Otro" },
};

interface DocumentTemplatesProps {
  patientName?: string;
  doctorName?: string;
}

export const DocumentTemplates = ({ patientName, doctorName }: DocumentTemplatesProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "consent",
    content: "",
  });

  const openPreview = (template: Template) => {
    setSelectedTemplate(template);
    // Pre-fill known variables
    const initialValues: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === "PATIENT_NAME" && patientName) initialValues[v] = patientName;
      if (v === "DOCTOR_NAME" && doctorName) initialValues[v] = doctorName;
      if (v === "DATE") initialValues[v] = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });
    });
    setVariableValues(initialValues);
    setIsPreviewOpen(true);
  };

  const fillTemplate = (content: string, values: Record<string, string>) => {
    let filled = content;
    Object.entries(values).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    return filled;
  };

  const printDocument = () => {
    if (!selectedTemplate) return;
    
    const filledContent = fillTemplate(selectedTemplate.content, variableValues);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedTemplate.name} - NovellDent</title>
        <style>
          body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #1a5f7a; font-size: 14px; }
          pre { white-space: pre-wrap; font-family: inherit; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">NovellDent - Clínica Dental</h1>
        </div>
        <pre>${filledContent}</pre>
        <div class="footer">
          NovellDent - Tel: +52 322 183 7666 | www.novelldent.com
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    // Extract variables from content
    const variableMatches = newTemplate.content.match(/{{(\w+)}}/g) || [];
    const variables = [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))];

    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category,
      content: newTemplate.content,
      variables,
      createdAt: new Date(),
    };

    setTemplates([template, ...templates]);
    setNewTemplate({ name: "", category: "consent", content: "" });
    setIsCreateOpen(false);
    toast({ title: "Plantilla creada", description: "La plantilla se ha guardado correctamente." });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({ title: "Plantilla eliminada" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Plantillas de Documentos
          </CardTitle>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Plantilla</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de la Plantilla</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Ej: Consentimiento de Ortodoncia"
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Contenido</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Usa {'{{VARIABLE_NAME}}'} para campos dinámicos (ej: {'{{PATIENT_NAME}}'}, {'{{DATE}}'})
                  </p>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Escribe el contenido de la plantilla..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={createTemplate}>Guardar Plantilla</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const config = categoryConfig[template.category] || categoryConfig.other;
            const Icon = config.icon;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-secondary ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">{config.label}</Badge>
                </div>
                
                <h3 className="font-medium mb-2">{template.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {template.variables.length} campos editables
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openPreview(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Usar
                  </Button>
                  {!defaultTemplates.find(t => t.id === template.id) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
      
      {/* Preview & Fill Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Variables Form */}
              <div className="space-y-4">
                <h4 className="font-medium">Completar Campos</h4>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={variable}>{variable.replace(/_/g, ' ')}</Label>
                    <Input
                      id={variable}
                      value={variableValues[variable] || ''}
                      onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                      placeholder={`Ingresa ${variable.toLowerCase().replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>
              
              {/* Preview */}
              <div>
                <h4 className="font-medium mb-2">Vista Previa</h4>
                <div className="border rounded-lg p-4 bg-secondary/20 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {fillTemplate(selectedTemplate.content, variableValues)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cerrar</Button>
            <Button onClick={printDocument}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
