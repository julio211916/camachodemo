import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Upload, Image, FileText, Box, Eye, Download, Trash2,
  Loader2, X, ZoomIn, ZoomOut, RotateCw, Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

import { DICOMViewer } from "@/components/clinic/DICOMViewer";
import { Dental3DViewer } from "@/components/clinic/Dental3DViewer";

interface PatientImagingSectionProps {
  patientId: string;
  patientName: string;
}

type DocumentType = 'xray' | 'cbct' | 'panoramic' | 'photo' | '3d_model' | 'dicom' | 'other';

const documentTypes: { value: DocumentType; label: string; icon: any }[] = [
  { value: 'xray', label: 'Radiografías', icon: Image },
  { value: 'panoramic', label: 'Panorámicas', icon: Image },
  { value: 'cbct', label: 'CBCT', icon: Box },
  { value: 'dicom', label: 'DICOM', icon: FileText },
  { value: '3d_model', label: 'Modelos 3D', icon: Box },
  { value: 'photo', label: 'Fotografías', icon: Image }
];

export const PatientImagingSection = ({ patientId, patientName }: PatientImagingSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DocumentType>('xray');
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [showDicomViewer, setShowDicomViewer] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${patientId}/${Date.now()}-${file.name}`;
        
        // Determine document type
        let docType: DocumentType = 'other';
        if (['dcm', 'dicom'].includes(fileExt || '')) docType = 'dicom';
        else if (['stl', 'obj', 'ply'].includes(fileExt || '')) docType = '3d_model';
        else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) docType = 'photo';

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('patient-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: insertError } = await supabase.from('patient_documents').insert({
          patient_id: patientId,
          file_name: file.name,
          file_url: uploadData.path,
          document_type: docType,
          file_size: file.size,
          mime_type: file.type
        });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: "Archivos subidos", description: "Los documentos han sido guardados" });
      setUploading(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUploading(false);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      // Delete from storage
      await supabase.storage.from('patient-documents').remove([doc.file_url]);
      
      // Delete record
      const { error } = await supabase.from('patient_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: "Documento eliminado" });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const getSignedUrl = async (path: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(path, 3600);
    return data?.signedUrl || '';
  };

  const viewDocument = async (doc: any) => {
    const url = await getSignedUrl(doc.file_url);
    
    if (doc.document_type === 'dicom' || doc.file_name.endsWith('.dcm')) {
      setShowDicomViewer(true);
    } else if (doc.document_type === '3d_model' || ['stl', 'obj', 'ply'].some(ext => doc.file_name.toLowerCase().endsWith(ext))) {
      setShow3DViewer(true);
    } else {
      setPreviewDoc({ ...doc, signedUrl: url });
    }
  };

  const downloadDocument = async (doc: any) => {
    const url = await getSignedUrl(doc.file_url);
    window.open(url, '_blank');
  };

  const filteredDocs = documents.filter((doc: any) => {
    if (activeTab === 'xray') return ['xray', 'radiograph'].includes(doc.document_type);
    if (activeTab === 'panoramic') return doc.document_type === 'panoramic';
    if (activeTab === 'cbct') return doc.document_type === 'cbct';
    if (activeTab === 'dicom') return doc.document_type === 'dicom' || doc.file_name?.endsWith('.dcm');
    if (activeTab === '3d_model') return doc.document_type === '3d_model' || ['stl', 'obj', 'ply'].some(ext => doc.file_name?.toLowerCase().endsWith(ext));
    if (activeTab === 'photo') return doc.document_type === 'photo' || ['jpg', 'jpeg', 'png', 'gif'].some(ext => doc.file_name?.toLowerCase().endsWith(ext));
    return false;
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Rx y Documentos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDicomViewer(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Visor DICOM
              </Button>
              <Button variant="outline" onClick={() => setShow3DViewer(true)}>
                <Box className="w-4 h-4 mr-2" />
                Visor 3D
              </Button>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".dcm,.dicom,.stl,.obj,.ply,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button asChild disabled={uploading}>
                  <span>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Subir Archivos
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)}>
            <TabsList className="grid grid-cols-6 mb-4">
              {documentTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value} className="gap-2">
                  <type.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{type.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {documents.filter((d: any) => {
                      if (type.value === 'xray') return ['xray', 'radiograph'].includes(d.document_type);
                      if (type.value === 'dicom') return d.document_type === 'dicom' || d.file_name?.endsWith('.dcm');
                      if (type.value === '3d_model') return d.document_type === '3d_model' || ['stl', 'obj', 'ply'].some(ext => d.file_name?.toLowerCase().endsWith(ext));
                      if (type.value === 'photo') return d.document_type === 'photo' || ['jpg', 'jpeg', 'png', 'gif'].some(ext => d.file_name?.toLowerCase().endsWith(ext));
                      return d.document_type === type.value;
                    }).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No hay documentos en esta categoría</p>
                  <label>
                    <input
                      type="file"
                      multiple
                      accept=".dcm,.dicom,.stl,.obj,.ply,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="link" asChild>
                      <span>Subir primer documento</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredDocs.map((doc: any) => (
                    <Card 
                      key={doc.id}
                      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div 
                        className="aspect-square bg-muted flex items-center justify-center"
                        onClick={() => viewDocument(doc)}
                      >
                        {['jpg', 'jpeg', 'png', 'gif'].some(ext => doc.file_name?.toLowerCase().endsWith(ext)) ? (
                          <img 
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/patient-documents/${doc.file_url}`}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : doc.document_type === '3d_model' || ['stl', 'obj', 'ply'].some(ext => doc.file_name?.toLowerCase().endsWith(ext)) ? (
                          <Box className="w-12 h-12 text-muted-foreground" />
                        ) : doc.document_type === 'dicom' || doc.file_name?.endsWith('.dcm') ? (
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        ) : (
                          <Image className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'd MMM yyyy', { locale: es })}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => viewDocument(doc)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => downloadDocument(doc)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteMutation.mutate(doc)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setImageZoom(1); setImageRotation(0); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewDoc?.file_name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setImageRotation(r => (r + 90) % 360)}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-black/5 rounded-lg">
            {previewDoc && (
              <img 
                src={previewDoc.signedUrl}
                alt={previewDoc.file_name}
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.2s'
                }}
                className="max-w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DICOM Viewer Dialog */}
      <Dialog open={showDicomViewer} onOpenChange={setShowDicomViewer}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DICOMViewer patientId={patientId} patientName={patientName} />
        </DialogContent>
      </Dialog>

      {/* 3D Viewer Dialog */}
      <Dialog open={show3DViewer} onOpenChange={setShow3DViewer}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <Dental3DViewer patientId={patientId} patientName={patientName} />
        </DialogContent>
      </Dialog>
    </>
  );
};
