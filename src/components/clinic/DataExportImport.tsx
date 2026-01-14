import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, FileText, Loader2, Check, X,
  AlertTriangle, FolderOpen, File, Image as ImageIcon, Video, FileArchive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from 'xlsx';

interface DataExportImportProps {
  patientId?: string;
}

type ExportFormat = 'xlsx' | 'csv' | 'json';
type DataCategory = 'patients' | 'appointments' | 'treatments' | 'invoices' | 'inventory';

interface FilePreview {
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export const DataExportImport = ({ patientId }: DataExportImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>(['patients']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch data for export
  const { data: patients = [] } = useQuery({
    queryKey: ['export-patients'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('full_name');
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['export-appointments'],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
      return data || [];
    },
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['export-treatments'],
    queryFn: async () => {
      const { data } = await supabase.from('treatments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['export-invoices'],
    queryFn: async () => {
      const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['export-inventory'],
    queryFn: async () => {
      const { data } = await supabase.from('inventory').select('*').order('name');
      return data || [];
    },
  });

  const categories: { id: DataCategory; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'patients', label: 'Pacientes', count: patients.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'appointments', label: 'Citas', count: appointments.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'treatments', label: 'Tratamientos', count: treatments.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'invoices', label: 'Facturas', count: invoices.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventario', count: inventory.length, icon: <FileText className="w-4 h-4" /> },
  ];

  const toggleCategory = (category: DataCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos una categoría", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const workbook = XLSX.utils.book_new();
      const totalCategories = selectedCategories.length;
      let processed = 0;

      for (const category of selectedCategories) {
        let data: any[] = [];
        let sheetName = '';

        switch (category) {
          case 'patients':
            data = patients.map(p => ({
              'ID': p.id,
              'Nombre': p.full_name,
              'Email': p.email,
              'Teléfono': p.phone,
              'Dirección': p.address,
              'Fecha Nacimiento': p.date_of_birth,
              'Género': p.gender,
              'Notas': p.notes,
              'Creado': p.created_at,
            }));
            sheetName = 'Pacientes';
            break;
          case 'appointments':
            data = appointments.map(a => ({
              'ID': a.id,
              'Paciente': a.patient_name,
              'Email': a.patient_email,
              'Teléfono': a.patient_phone,
              'Fecha': a.appointment_date,
              'Hora': a.appointment_time,
              'Servicio': a.service_name,
              'Ubicación': a.location_name,
              'Estado': a.status,
              'Notas': a.notes,
            }));
            sheetName = 'Citas';
            break;
          case 'treatments':
            data = treatments.map(t => ({
              'ID': t.id,
              'Nombre': t.name,
              'Descripción': t.description,
              'Diagnóstico': t.diagnosis,
              'Plan': t.treatment_plan,
              'Costo': t.cost,
              'Estado': t.status,
              'Fecha Inicio': t.start_date,
              'Fecha Fin': t.end_date,
            }));
            sheetName = 'Tratamientos';
            break;
          case 'invoices':
            data = invoices.map(i => ({
              'Número': i.invoice_number,
              'Paciente': i.patient_name,
              'Subtotal': i.subtotal,
              'Descuento': i.discount_amount,
              'Impuesto': i.tax_amount,
              'Total': i.total,
              'Estado': i.status,
              'Fecha': i.created_at,
              'Vencimiento': i.due_date,
            }));
            sheetName = 'Facturas';
            break;
          case 'inventory':
            data = inventory.map(i => ({
              'ID': i.id,
              'Nombre': i.name,
              'Categoría': i.category,
              'Cantidad': i.quantity,
              'Stock Mínimo': i.min_stock,
              'Unidad': i.unit,
              'Costo Unitario': i.unit_cost,
              'Proveedor': i.supplier,
            }));
            sheetName = 'Inventario';
            break;
        }

        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        processed++;
        setExportProgress((processed / totalCategories) * 100);
        await new Promise(r => setTimeout(r, 200)); // Small delay for UI
      }

      // Generate file
      const fileName = `NovellDent_Export_${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat === 'xlsx') {
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
      } else if (exportFormat === 'csv') {
        // Export each sheet as separate CSV
        for (const sheetName of workbook.SheetNames) {
          const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileName}_${sheetName}.csv`;
          link.click();
        }
      } else if (exportFormat === 'json') {
        const jsonData: Record<string, any[]> = {};
        for (const sheetName of workbook.SheetNames) {
          jsonData[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.json`;
        link.click();
      }

      toast({ title: "Exportación completada", description: `Archivo ${fileName} generado` });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo exportar los datos", variant: "destructive" });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (newFiles: File[]) => {
    const previews: FilePreview[] = newFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...previews]);

    // Process each file
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fileIndex = files.length + i;
      
      setFiles(prev => prev.map((f, idx) => 
        idx === fileIndex ? { ...f, status: 'uploading' as const } : f
      ));

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(r => setTimeout(r, 100));
          setFiles(prev => prev.map((f, idx) => 
            idx === fileIndex ? { ...f, progress } : f
          ));
        }

        // Parse file if it's a spreadsheet
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          
          toast({
            title: "Archivo procesado",
            description: `${workbook.SheetNames.length} hojas encontradas en ${file.name}`,
          });
        }

        setFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: 'success' as const, progress: 100 } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: 'error' as const, error: 'Error al procesar' } : f
        ));
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (type.includes('zip') || type.includes('archive')) return <FileArchive className="w-5 h-5 text-amber-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Exportar / Importar Datos
        </CardTitle>
        <CardDescription>
          Exporta datos en Excel/CSV o importa archivos al sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="export" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Importar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4 mt-4">
            {/* Format Selection */}
            <div className="flex items-center gap-4">
              <Label>Formato:</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Category Selection */}
            <div>
              <Label className="mb-3 block">Selecciona los datos a exportar:</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategories.includes(cat.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <Checkbox checked={selectedCategories.includes(cat.id)} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.count} registros</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exportando...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}
            
            <Button 
              onClick={handleExport} 
              disabled={isExporting || selectedCategories.length === 0}
              className="w-full gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exportando...' : `Exportar ${selectedCategories.length} categoría(s)`}
            </Button>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 mt-4">
            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium mb-1">
                {isDragging ? 'Suelta los archivos aquí' : 'Arrastra y suelta archivos'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                o haz clic para seleccionar
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.json,.stl,.obj,.ply,.dcm,.jpg,.jpeg,.png,.pdf,.mp4,.mov"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Formatos soportados: Excel, CSV, JSON, STL, OBJ, PLY, DICOM, Imágenes, Videos, PDF
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <ScrollArea className="h-64 rounded-lg border">
                <div className="p-3 space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="h-1 mt-1" />
                        )}
                        {file.error && (
                          <span className="text-xs text-destructive">{file.error}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        {file.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                        {file.status === 'error' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {files.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {files.filter(f => f.status === 'success').length} de {files.length} archivos procesados
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFiles([])}
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataExportImport;
