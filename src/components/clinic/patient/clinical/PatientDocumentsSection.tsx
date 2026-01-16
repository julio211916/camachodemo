import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, Plus, Eye, Printer, Edit, Settings,
  Loader2, Check, X, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientDocumentsSectionProps {
  patientId: string;
  patientName: string;
}

export const PatientDocumentsSection = ({ patientId, patientName }: PatientDocumentsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [documentContent, setDocumentContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Editing template state
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateActive, setTemplateActive] = useState(true);

  // Fetch document templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', 'clinical')
        .order('display_order');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch generated documents for this patient
  const { data: generatedDocs = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['patient-generated-docs', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('document_type', 'clinical_document')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Create document mutation
  const createDocument = useMutation({
    mutationFn: async () => {
      // Save as patient document
      const fileName = `clinical-doc-${Date.now()}.html`;
      const blob = new Blob([documentContent], { type: 'text/html' });
      const filePath = `${patientId}/clinical-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { error } = await supabase.from('patient_documents').insert({
        patient_id: patientId,
        file_name: fileName,
        file_url: filePath,
        document_type: 'clinical_document',
        description: templates.find((t: any) => t.id === selectedTemplate)?.name
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-generated-docs', patientId] });
      toast({ title: "Documento creado" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Save template mutation
  const saveTemplate = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateName,
        category: templateCategory,
        content: templateContent,
        is_active: templateActive,
        template_type: 'clinical'
      };

      if (editingTemplate?.id) {
        const { error } = await supabase
          .from('document_templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('document_templates')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: editingTemplate ? "Plantilla actualizada" : "Plantilla creada" });
      setEditingTemplate(null);
      resetTemplateForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Toggle template status
  const toggleTemplateStatus = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    }
  });

  const resetForm = () => {
    setSelectedTemplate("");
    setDocumentContent("");
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateCategory("");
    setTemplateContent("");
    setTemplateActive(true);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      let content = template.content;
      content = content.replace(/\{\{patient_name\}\}/g, patientName);
      content = content.replace(/\{\{date\}\}/g, format(new Date(), "d 'de' MMMM, yyyy", { locale: es }));
      setDocumentContent(content);
    }
    setSelectedTemplate(templateId);
  };

  const editTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateCategory(template.category || '');
    setTemplateContent(template.content);
    setTemplateActive(template.is_active);
  };

  const printDocument = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Documento Clínico - ${patientName}</title></head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredTemplates = templates.filter((t: any) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos Clínicos
            </CardTitle>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTemplateManagerOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Plantillas
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Documento
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loadingDocs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : generatedDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No hay documentos clínicos generados</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Crear primer documento
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {generatedDocs.map((doc: any) => (
                  <Card key={doc.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.description || doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(doc.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Documento Clínico</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Seleccionar Plantilla</Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter((t: any) => t.is_active).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contenido</Label>
              <Textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Contenido del documento..."
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => printDocument(documentContent)}>
              <Printer className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createDocument.mutate()}
              disabled={!documentContent || createDocument.isPending}
            >
              {createDocument.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                'Guardar Documento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Manager Dialog */}
      <Dialog open={templateManagerOpen} onOpenChange={setTemplateManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Plantillas de Documentos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => editTemplate({})}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Plantilla
              </Button>
            </div>

            {/* Templates Table */}
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.category || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleTemplateStatus.mutate(template)}
                        >
                          {template.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => editTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => { setEditingTemplate(null); resetTemplateForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nombre de la plantilla"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fichas">Fichas</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Consentimientos">Consentimientos</SelectItem>
                    <SelectItem value="Instrucciones">Instrucciones</SelectItem>
                    <SelectItem value="Certificados">Certificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="template-active"
                checked={templateActive}
                onCheckedChange={setTemplateActive}
              />
              <Label htmlFor="template-active">Plantilla activa</Label>
            </div>

            <div>
              <Label>Contenido (HTML)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Variables disponibles: {"{{patient_name}}"}, {"{{date}}"}
              </p>
              <Textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="<h1>Título</h1><p>Contenido...</p>"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingTemplate(null); resetTemplateForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => saveTemplate.mutate()}
              disabled={!templateName || !templateContent || saveTemplate.isPending}
            >
              {saveTemplate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                'Guardar Plantilla'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
