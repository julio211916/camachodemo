import { useState, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Grid,
  List,
  FileArchive,
  FileCode,
  Scan,
  FileType,
  HardDrive,
  Package,
  FileCheck,
  Share2,
  FolderDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STLViewer = lazy(() => import("./STLViewer"));

interface AdvancedFileManagerProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

// Configuración completa de tipos de archivo
const fileCategories = {
  image: {
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
    icon: Image,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Imágenes',
    description: 'Fotos clínicas, intraorales, extraorales'
  },
  xray: {
    extensions: ['.dcm', '.dicom'],
    mimeTypes: ['application/dicom'],
    icon: Scan,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    label: 'Radiografías/DICOM',
    description: 'DICOM, CBCT, Panorámicas, Periapicales'
  },
  model3d: {
    extensions: ['.stl', '.ply', '.obj'],
    mimeTypes: ['model/stl', 'application/sla', 'model/x-ply'],
    icon: Box,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'Modelos 3D',
    description: 'STL, PLY, archivos CAD/CAM'
  },
  pacs: {
    extensions: ['.zip', '.7z', '.rar'],
    mimeTypes: ['application/zip', 'application/x-7z-compressed', 'application/vnd.rar'],
    icon: FileArchive,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    label: 'PACS/Archivos',
    description: 'Paquetes PACS, estudios comprimidos'
  },
  xml: {
    extensions: ['.xml'],
    mimeTypes: ['application/xml', 'text/xml'],
    icon: FileCode,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'XML/Datos',
    description: 'Exportaciones EMR, cephalometría'
  },
  document: {
    extensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    icon: FileText,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Documentos',
    description: 'Consentimientos, informes, recetas'
  },
  other: {
    extensions: [],
    mimeTypes: [],
    icon: File,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'Otros',
    description: 'Otros archivos'
  }
};

const getFileCategory = (fileName: string, mimeType?: string): keyof typeof fileCategories => {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  
  for (const [key, config] of Object.entries(fileCategories)) {
    if (config.extensions.includes(ext)) return key as keyof typeof fileCategories;
    if (mimeType && config.mimeTypes.includes(mimeType)) return key as keyof typeof fileCategories;
  }
  return 'other';
};

export const AdvancedFileManager = ({ patientId, patientName, readOnly = false }: AdvancedFileManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("image");
  const [fileDescription, setFileDescription] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch patient documents
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch patient profile
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', patientId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch medical history
  const { data: medicalHistory } = useQuery({
    queryKey: ['medical-history', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments-export', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments-export', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Upload mutation - stores file path only (secure pattern - no public URLs)
  const uploadMutation = useMutation({
    mutationFn: async ({ file, category, description }: { file: File; category: string; description: string }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${patientId}/${Date.now()}_${category}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Store file path only - generate signed URL when viewing
      const { error: dbError } = await supabase.from('patient_documents').insert({
        patient_id: patientId,
        file_name: file.name,
        file_url: filePath, // Store path, not public URL
        document_type: category,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        description: description || null,
        uploaded_by: user?.id,
      });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] });
      toast({ title: "✅ Archivo subido", description: "El archivo se ha guardado correctamente." });
      setUploadDialogOpen(false);
      setFileDescription("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
      console.error('Upload error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.from('patient_documents').delete().eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] });
      toast({ title: "Archivo eliminado", description: "El archivo se ha eliminado correctamente." });
      setSelectedFile(null);
    },
  });

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = selectedFiles.length;
      let completed = 0;
      
      for (const file of Array.from(selectedFiles)) {
        await uploadMutation.mutateAsync({ 
          file, 
          category: selectedCategory,
          description: fileDescription 
        });
        completed++;
        setUploadProgress((completed / totalFiles) * 100);
      }
      
      toast({ 
        title: "✅ Subida completada", 
        description: `${totalFiles} archivo(s) subidos correctamente.` 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // Export clinical history
  const exportClinicalHistory = async () => {
    setIsExporting(true);
    
    try {
      // Build complete clinical history JSON
      const clinicalHistory = {
        exportDate: new Date().toISOString(),
        exportFormat: 'NovellDent Clinical Export v1.0',
        patient: {
          id: patientId,
          name: patientProfile?.full_name || patientName,
          email: patientProfile?.email,
          phone: patientProfile?.phone,
          dateOfBirth: patientProfile?.date_of_birth,
          address: patientProfile?.address,
        },
        medicalHistory: medicalHistory ? {
          bloodType: medicalHistory.blood_type,
          allergies: medicalHistory.allergies || [],
          conditions: medicalHistory.conditions || [],
          medications: medicalHistory.medications || [],
          emergencyContact: {
            name: medicalHistory.emergency_contact_name,
            phone: medicalHistory.emergency_contact_phone
          },
          notes: medicalHistory.notes
        } : null,
        treatments: treatments.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          diagnosis: t.diagnosis,
          treatmentPlan: t.treatment_plan,
          status: t.status,
          cost: t.cost,
          startDate: t.start_date,
          endDate: t.end_date,
          notes: t.notes
        })),
        appointments: appointments.filter(a => 
          a.patient_email === patientProfile?.email
        ).map(a => ({
          id: a.id,
          date: a.appointment_date,
          time: a.appointment_time,
          service: a.service_name,
          location: a.location_name,
          status: a.status,
          notes: a.notes
        })),
        documents: files.map(f => ({
          id: f.id,
          fileName: f.file_name,
          type: f.document_type,
          url: f.file_url,
          size: f.file_size,
          uploadedAt: f.created_at,
          description: f.description
        })),
        statistics: {
          totalDocuments: files.length,
          totalTreatments: treatments.length,
          totalAppointments: appointments.filter(a => a.patient_email === patientProfile?.email).length,
          documentsByCategory: Object.entries(fileCategories).reduce((acc, [key]) => {
            acc[key] = files.filter(f => getFileCategory(f.file_name, f.mime_type) === key).length;
            return acc;
          }, {} as Record<string, number>)
        }
      };

      // Create JSON file
      const jsonContent = JSON.stringify(clinicalHistory, null, 2);
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(jsonBlob);
      downloadLink.download = `historial_clinico_${patientName || patientId}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Also create a human-readable summary
      const summaryText = `
═══════════════════════════════════════════════════════════════════
                    HISTORIAL CLÍNICO - NOVELLDENT
═══════════════════════════════════════════════════════════════════

Fecha de exportación: ${format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATOS DEL PACIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${patientProfile?.full_name || patientName || 'N/A'}
Email: ${patientProfile?.email || 'N/A'}
Teléfono: ${patientProfile?.phone || 'N/A'}
Fecha de nacimiento: ${patientProfile?.date_of_birth || 'N/A'}
Dirección: ${patientProfile?.address || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HISTORIA MÉDICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tipo de sangre: ${medicalHistory?.blood_type || 'No registrado'}
Alergias: ${medicalHistory?.allergies?.join(', ') || 'Ninguna registrada'}
Condiciones: ${medicalHistory?.conditions?.join(', ') || 'Ninguna registrada'}
Medicamentos: ${medicalHistory?.medications?.join(', ') || 'Ninguno registrado'}
Contacto de emergencia: ${medicalHistory?.emergency_contact_name || 'N/A'} - ${medicalHistory?.emergency_contact_phone || 'N/A'}
Notas: ${medicalHistory?.notes || 'Sin notas'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRATAMIENTOS (${treatments.length} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${treatments.map(t => `
• ${t.name}
  Estado: ${t.status || 'N/A'}
  Diagnóstico: ${t.diagnosis || 'N/A'}
  Plan: ${t.treatment_plan || 'N/A'}
  Fecha inicio: ${t.start_date ? format(new Date(t.start_date), "d/MM/yyyy", { locale: es }) : 'N/A'}
  Costo: ${t.cost ? `$${t.cost.toLocaleString()}` : 'N/A'}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENTOS ADJUNTOS (${files.length} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${files.map(f => `• ${f.file_name} (${fileCategories[getFileCategory(f.file_name, f.mime_type)]?.label || 'Otro'})`).join('\n')}

═══════════════════════════════════════════════════════════════════
                  Exportado por NovellDent CRM
═══════════════════════════════════════════════════════════════════
      `;
      
      const summaryBlob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
      const summaryLink = document.createElement('a');
      summaryLink.href = URL.createObjectURL(summaryBlob);
      summaryLink.download = `resumen_clinico_${patientName || patientId}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(summaryLink);
      summaryLink.click();
      document.body.removeChild(summaryLink);
      
      toast({ 
        title: "✅ Exportación completada", 
        description: "Se han descargado el historial clínico en formato JSON y un resumen en texto." 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo exportar el historial clínico.", 
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const fileCategory = getFileCategory(file.file_name, file.mime_type);
    const matchesCategory = categoryFilter === "all" || fileCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileStats = () => {
    const stats: Record<string, number> = {};
    files.forEach(file => {
      const cat = getFileCategory(file.file_name, file.mime_type);
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  };

  const isImageFile = (mimeType: string | null) => mimeType?.startsWith('image/');
  const isSTLFile = (fileName: string) => fileName?.toLowerCase().endsWith('.stl') || fileName?.toLowerCase().endsWith('.ply');

  const fileStats = getFileStats();

  const getCategoryConfig = (fileName: string, mimeType?: string | null) => {
    const cat = getFileCategory(fileName, mimeType || undefined);
    return fileCategories[cat];
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-primary/10">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              Gestor de Archivos Médicos
              {patientName && (
                <Badge variant="secondary" className="ml-2">{patientName}</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Soporta: PNG, JPEG, XML, DICOM, STL, PLY, PACS, PDF
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    Subir Archivos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Subir Archivos Médicos
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Category Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(fileCategories).filter(([key]) => key !== 'other').map(([key, config]) => {
                        const IconComponent = config.icon;
                        const isSelected = selectedCategory === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`p-2 rounded-lg w-fit ${config.bgColor}`}>
                              <IconComponent className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <p className="font-medium mt-2 text-sm">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium">Descripción (opcional)</label>
                      <Textarea
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder="Añade una descripción o notas sobre los archivos..."
                        className="mt-2"
                      />
                    </div>
                    
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff,.dcm,.dicom,.stl,.ply,.obj,.zip,.7z,.rar,.xml,.pdf,.doc,.docx"
                        onChange={handleMultipleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="file-upload-input"
                      />
                      <label htmlFor="file-upload-input" className="cursor-pointer">
                        {isUploading ? (
                          <div className="space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground">Subiendo archivos...</p>
                            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Click para seleccionar archivos</p>
                              <p className="text-sm text-muted-foreground">o arrastra y suelta aquí</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                              <Badge variant="outline">PNG</Badge>
                              <Badge variant="outline">JPEG</Badge>
                              <Badge variant="outline">XML</Badge>
                              <Badge variant="outline">DICOM</Badge>
                              <Badge variant="outline">STL</Badge>
                              <Badge variant="outline">PLY</Badge>
                              <Badge variant="outline">PACS/ZIP</Badge>
                              <Badge variant="outline">PDF</Badge>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Export Button */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderDown className="w-4 h-4" />
                  Exportar Historial
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-green-500" />
                    Exportar Historial Clínico
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-muted-foreground">
                    Se exportará el historial clínico completo incluyendo:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      Datos personales del paciente
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      Historia médica (alergias, condiciones, medicamentos)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      Tratamientos realizados
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      Citas y consultas
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      Lista de documentos adjuntos ({files.length} archivos)
                    </li>
                  </ul>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium">Formatos de exportación:</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>JSON (datos estructurados)</Badge>
                      <Badge>TXT (resumen legible)</Badge>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={exportClinicalHistory} 
                    disabled={isExporting}
                    className="gap-2"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? 'Exportando...' : 'Exportar Ahora'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(fileCategories).map(([key, config]) => {
            const count = fileStats[key] || 0;
            if (count === 0) return null;
            const IconComponent = config.icon;
            return (
              <Badge 
                key={key} 
                variant="secondary" 
                className={`gap-1 ${config.bgColor} border-none`}
              >
                <IconComponent className={`w-3 h-3 ${config.color}`} />
                {count} {config.label}
              </Badge>
            );
          })}
          <Badge variant="outline" className="gap-1">
            <HardDrive className="w-3 h-3" />
            {files.length} archivos totales
          </Badge>
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(fileCategories).map(([key, config]) => (
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
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">No hay archivos</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'No se encontraron resultados' : 'Sube el primer archivo del paciente'}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const config = getCategoryConfig(file.file_name, file.mime_type);
                const IconComponent = config.icon;
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                    className="group relative border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-card"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className={`aspect-square flex items-center justify-center rounded-lg mb-3 ${config.bgColor}`}>
                      {isImageFile(file.mime_type) ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <IconComponent className={`w-10 h-10 ${config.color}`} />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs mt-2 ${config.bgColor} border-none`}
                    >
                      {config.label}
                    </Badge>
                    
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
                      {!readOnly && (
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
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const config = getCategoryConfig(file.file_name, file.mime_type);
                const IconComponent = config.icon;
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${config.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{format(new Date(file.created_at), "d MMM yyyy", { locale: es })}</span>
                          {file.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{file.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${config.bgColor} border-none ${config.color}`}>
                        {config.label}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedFile(file)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => window.open(file.file_url, '_blank')}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {!readOnly && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive" 
                          onClick={() => deleteMutation.mutate(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
      
      {/* File Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFile && (
                <>
                  <div className={`p-2 rounded-lg ${getCategoryConfig(selectedFile.file_name, selectedFile.mime_type).bgColor}`}>
                    {(() => {
                      const IconComp = getCategoryConfig(selectedFile.file_name, selectedFile.mime_type).icon;
                      return <IconComp className={`w-5 h-5 ${getCategoryConfig(selectedFile.file_name, selectedFile.mime_type).color}`} />;
                    })()}
                  </div>
                  <div>
                    <p>{selectedFile.file_name}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {formatFileSize(selectedFile.file_size)} • {format(new Date(selectedFile.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </>
              )}
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
              <Suspense fallback={
                <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando visor 3D...</span>
                </div>
              }>
                <STLViewer 
                  fileUrl={selectedFile.file_url} 
                  fileName={selectedFile.file_name} 
                />
              </Suspense>
            )}
            
            {selectedFile && !isImageFile(selectedFile.mime_type) && !isSTLFile(selectedFile.file_name) && (
              <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {(() => {
                    const config = getCategoryConfig(selectedFile.file_name, selectedFile.mime_type);
                    const IconComp = config.icon;
                    return (
                      <div className={`p-6 rounded-2xl ${config.bgColor} w-fit mx-auto mb-4`}>
                        <IconComp className={`w-16 h-16 ${config.color}`} />
                      </div>
                    );
                  })()}
                  <p className="text-lg font-medium mb-2">{selectedFile.file_name}</p>
                  <p className="text-muted-foreground mb-6">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => window.open(selectedFile.file_url, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(selectedFile.file_url);
                      toast({ title: "URL copiada", description: "La URL del archivo se ha copiado al portapapeles." });
                    }}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Copiar URL
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedFile?.description && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Descripción:</p>
                <p className="text-sm text-muted-foreground">{selectedFile.description}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
