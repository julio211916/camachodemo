import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, Image, Trash2, Download, Eye, X } from "lucide-react";

interface DocumentUploadProps {
  patientId: string;
  patientName?: string;
}

const documentTypes = [
  { value: "radiografia", label: "Radiografía", icon: "🦷" },
  { value: "fotografia", label: "Fotografía", icon: "📷" },
  { value: "consentimiento", label: "Consentimiento", icon: "📝" },
  { value: "receta", label: "Receta", icon: "💊" },
  { value: "laboratorio", label: "Resultado Lab", icon: "🔬" },
  { value: "otro", label: "Otro", icon: "📄" },
];

interface Document {
  id: string;
  patient_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  created_at: string;
}

export const DocumentUpload = ({ patientId, patientName }: DocumentUploadProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState("radiografia");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      // Delete from storage
      const filePath = doc.file_url.split('/').pop();
      if (filePath) {
        await supabase.storage.from('patient-documents').remove([`${patientId}/${filePath}`]);
      }
      // Delete from database
      const { error } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: "Eliminado", description: "Documento eliminado correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    },
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${patientId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-documents')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          description: description || null,
          uploaded_by: user.user?.id,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: "Subido", description: "Documento subido correctamente" });
      setDescription("");
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "No se pudo subir el archivo", variant: "destructive" });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }, [patientId, documentType, description, queryClient, toast]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string | null) => mimeType?.startsWith('image/');

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📁 Documentos {patientName && `- ${patientName}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.icon} {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="md:col-span-2"
            />
          </div>
          
          <div className="flex items-center justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading}>
                <span>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? "Subiendo..." : "Subir Documento"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {documents?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay documentos cargados
            </p>
          ) : (
            documents?.map(doc => {
              const docTypeInfo = documentTypes.find(dt => dt.value === doc.document_type);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {isImage(doc.mime_type) ? "🖼️" : docTypeInfo?.icon || "📄"}
                    </div>
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {docTypeInfo?.label || doc.document_type}
                        </Badge>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isImage(doc.mime_type) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(doc.file_url)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vista Previa</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Vista previa"
                className="max-h-[70vh] object-contain mx-auto"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
