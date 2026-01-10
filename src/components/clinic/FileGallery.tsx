import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  Upload, 
  File, 
  Image, 
  FileText, 
  Box,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Loader2,
  X,
  Grid,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FileGalleryProps {
  patientId?: string;
  patientName?: string;
}

const fileTypeConfig: Record<string, { icon: typeof File; color: string; label: string }> = {
  image: { icon: Image, color: "text-blue-500", label: "Imagen" },
  document: { icon: FileText, color: "text-green-500", label: "Documento" },
  stl: { icon: Box, color: "text-purple-500", label: "Archivo STL" },
  xray: { icon: Image, color: "text-amber-500", label: "Radiografía" },
  prescription: { icon: FileText, color: "text-red-500", label: "Receta" },
  other: { icon: File, color: "text-gray-500", label: "Otro" },
};

export const FileGallery = ({ patientId, patientName }: FileGalleryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      let query = supabase.from('patient_documents').select('*');
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Upload file
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      if (!patientId) throw new Error('Se requiere un paciente');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-documents')
        .getPublicUrl(fileName);
      
      // Save to database
      const { error: dbError } = await supabase.from('patient_documents').insert({
        patient_id: patientId,
        file_name: file.name,
        file_url: publicUrl,
        document_type: documentType,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user?.id,
      });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] });
      toast({ title: "Archivo subido", description: "El archivo se ha subido correctamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
    },
  });

  // Delete file
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.from('patient_documents').delete().eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] });
      toast({ title: "Archivo eliminado", description: "El archivo se ha eliminado correctamente." });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync({ file, documentType });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || file.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    const config = fileTypeConfig[type] || fileTypeConfig.other;
    const IconComponent = config.icon;
    return <IconComponent className={`w-8 h-8 ${config.color}`} />;
  };

  const isImageFile = (mimeType: string) => mimeType?.startsWith('image/');
  const isSTLFile = (fileName: string) => fileName?.toLowerCase().endsWith('.stl');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Galería de Archivos
            {patientName && <Badge variant="secondary">{patientName}</Badge>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={!patientId || isUploading}>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Subir Archivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Nuevo Archivo</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  {Object.entries(fileTypeConfig).map(([key, config]) => (
                    <label key={key} className="cursor-pointer">
                      <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                        <config.icon className={`w-6 h-6 ${config.color}`} />
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {key === 'stl' ? 'Archivos .stl' : 'Cualquier formato'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept={key === 'stl' ? '.stl' : key === 'image' || key === 'xray' ? 'image/*' : '*'}
                        multiple
                        onChange={(e) => handleFileUpload(e, key)}
                      />
                    </label>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(fileTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay archivos</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <div className="aspect-square flex items-center justify-center bg-secondary/30 rounded-lg mb-3">
                  {isImageFile(file.mime_type) ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    getFileIcon(file.document_type)
                  )}
                </div>
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size || 0)}
                </p>
                
                {/* Quick actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.file_url, '_blank');
                    }}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(file.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getFileIcon(file.document_type)}
                  <div>
                    <p className="font-medium">{file.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size || 0)} • {format(new Date(file.created_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{fileTypeConfig[file.document_type]?.label || 'Otro'}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => setSelectedFile(file)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => window.open(file.file_url, '_blank')}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(file.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* File Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFile && getFileIcon(selectedFile.document_type)}
              {selectedFile?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedFile && isImageFile(selectedFile.mime_type) && (
              <img
                src={selectedFile.file_url}
                alt={selectedFile.file_name}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {selectedFile && isSTLFile(selectedFile.file_name) && (
              <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Box className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Visor 3D STL</p>
                  <Button onClick={() => window.open(selectedFile.file_url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar para ver en 3D
                  </Button>
                </div>
              </div>
            )}
            {selectedFile && !isImageFile(selectedFile.mime_type) && !isSTLFile(selectedFile.file_name) && (
              <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {getFileIcon(selectedFile.document_type)}
                  <p className="text-muted-foreground mt-4 mb-4">
                    Vista previa no disponible
                  </p>
                  <Button onClick={() => window.open(selectedFile.file_url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
