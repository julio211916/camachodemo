import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
  Users, Loader2, X, FileUp, Table2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ImportedPatient {
  full_name: string;
  email: string;
  phone?: string;
  gender?: string;
  birth_year?: number;
  address?: string;
  notes?: string;
  tags?: string[];
  isValid: boolean;
  errors: string[];
}

interface PatientImportExportProps {
  onImportComplete?: () => void;
}

export const PatientImportExport = ({ onImportComplete }: PatientImportExportProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<ImportedPatient[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });

  // Fetch existing patients for export
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_archived', false)
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Nombre Completo', 'Email', 'Teléfono', 'Género', 'Año Nacimiento', 'Dirección', 'Notas', 'Etiquetas'];
    const rows = patients.map(p => [
      p.full_name,
      p.email,
      p.phone || '',
      p.gender || '',
      p.birth_year || '',
      p.address || '',
      p.notes || '',
      (p.tags || []).join(';')
    ]);
    
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${patients.length} pacientes exportados a CSV` });
  };

  // Export to Excel-compatible format
  const exportToExcel = async () => {
    try {
      // Using ExcelJS which is already installed
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pacientes');
      
      // Add headers with styling
      worksheet.columns = [
        { header: 'Nombre Completo', key: 'full_name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Género', key: 'gender', width: 10 },
        { header: 'Año Nacimiento', key: 'birth_year', width: 15 },
        { header: 'Dirección', key: 'address', width: 40 },
        { header: 'Notas', key: 'notes', width: 40 },
        { header: 'Etiquetas', key: 'tags', width: 30 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A90A4' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add data
      patients.forEach(p => {
        worksheet.addRow({
          full_name: p.full_name,
          email: p.email,
          phone: p.phone || '',
          gender: p.gender || '',
          birth_year: p.birth_year || '',
          address: p.address || '',
          notes: p.notes || '',
          tags: (p.tags || []).join('; ')
        });
      });

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pacientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Exportado", description: `${patients.length} pacientes exportados a Excel` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Error", description: "No se pudo exportar a Excel", variant: "destructive" });
    }
  };

  // Parse CSV file
  const parseCSV = (text: string): ImportedPatient[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Map common header variations
    const headerMap: Record<string, string> = {
      'nombre completo': 'full_name',
      'nombre': 'full_name',
      'name': 'full_name',
      'full_name': 'full_name',
      'email': 'email',
      'correo': 'email',
      'teléfono': 'phone',
      'telefono': 'phone',
      'phone': 'phone',
      'celular': 'phone',
      'género': 'gender',
      'genero': 'gender',
      'gender': 'gender',
      'sexo': 'gender',
      'año nacimiento': 'birth_year',
      'birth_year': 'birth_year',
      'nacimiento': 'birth_year',
      'dirección': 'address',
      'direccion': 'address',
      'address': 'address',
      'notas': 'notes',
      'notes': 'notes',
      'observaciones': 'notes',
      'etiquetas': 'tags',
      'tags': 'tags'
    };

    const columnIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedName = headerMap[header];
      if (mappedName) columnIndices[mappedName] = index;
    });

    const patients: ImportedPatient[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const errors: string[] = [];
      
      const fullName = columnIndices.full_name !== undefined ? values[columnIndices.full_name] : '';
      const email = columnIndices.email !== undefined ? values[columnIndices.email] : '';
      
      if (!fullName) errors.push('Nombre requerido');
      if (!email) errors.push('Email requerido');
      else if (!email.includes('@')) errors.push('Email inválido');
      
      const birthYear = columnIndices.birth_year !== undefined ? parseInt(values[columnIndices.birth_year]) : undefined;
      if (birthYear && (birthYear < 1900 || birthYear > new Date().getFullYear())) {
        errors.push('Año de nacimiento inválido');
      }
      
      const tagsRaw = columnIndices.tags !== undefined ? values[columnIndices.tags] : '';
      const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : [];

      patients.push({
        full_name: fullName,
        email: email,
        phone: columnIndices.phone !== undefined ? values[columnIndices.phone] : undefined,
        gender: columnIndices.gender !== undefined ? values[columnIndices.gender]?.toLowerCase() : undefined,
        birth_year: birthYear && !isNaN(birthYear) ? birthYear : undefined,
        address: columnIndices.address !== undefined ? values[columnIndices.address] : undefined,
        notes: columnIndices.notes !== undefined ? values[columnIndices.notes] : undefined,
        tags,
        isValid: errors.length === 0,
        errors
      });
    }

    return patients;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Parse Excel
      try {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast({ title: "Error", description: "El archivo Excel está vacío", variant: "destructive" });
          return;
        }

        // Convert to CSV format for parsing
        const rows: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          const values = row.values as any[];
          // Skip first element (ExcelJS uses 1-based indexing)
          const rowData = values.slice(1).map(v => v?.toString() || '');
          rows.push(rowData.join(','));
        });

        const parsedData = parseCSV(rows.join('\n'));
        setImportedData(parsedData);
        setSelectedRows(new Set(parsedData.map((_, i) => i).filter(i => parsedData[i].isValid)));
        setShowImportDialog(true);
      } catch (error) {
        console.error('Excel parse error:', error);
        toast({ title: "Error", description: "No se pudo leer el archivo Excel", variant: "destructive" });
      }
    } else {
      // Parse CSV
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        setImportedData(parsedData);
        setSelectedRows(new Set(parsedData.map((_, i) => i).filter(i => parsedData[i].isValid)));
        setShowImportDialog(true);
      };
      reader.readAsText(file);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Import selected patients
  const importPatients = async () => {
    const selected = importedData.filter((_, i) => selectedRows.has(i) && importedData[i].isValid);
    if (selected.length === 0) {
      toast({ title: "Error", description: "No hay pacientes válidos seleccionados", variant: "destructive" });
      return;
    }

    setImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < selected.length; i++) {
      const patient = selected[i];
      try {
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: crypto.randomUUID(),
            full_name: patient.full_name,
            email: patient.email,
            phone: patient.phone || null,
            gender: patient.gender || null,
            birth_year: patient.birth_year || null,
            address: patient.address || null,
            notes: patient.notes || null,
            tags: patient.tags || [],
            is_archived: false
          });

        if (error) throw error;
        success++;
      } catch (error) {
        failed++;
        console.error('Import error:', error);
      }
      setImportProgress(Math.round(((i + 1) / selected.length) * 100));
    }

    setImportStats({ total: selected.length, success, failed });
    setImporting(false);
    
    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-export'] });
      toast({ 
        title: "Importación completada", 
        description: `${success} pacientes importados${failed > 0 ? `, ${failed} fallidos` : ''}` 
      });
      onImportComplete?.();
    }
    
    if (failed === selected.length) {
      toast({ title: "Error", description: "No se pudo importar ningún paciente", variant: "destructive" });
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = 'Nombre Completo,Email,Teléfono,Género,Año Nacimiento,Dirección,Notas,Etiquetas\n"Juan Pérez","juan@email.com","+52 311 123 4567","male","1985","Av. Principal 123","Paciente regular","VIP;Ortodoncia"';
    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_pacientes.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Plantilla descargada" });
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const selectAllValid = () => {
    const validIndices = importedData.map((p, i) => p.isValid ? i : -1).filter(i => i !== -1);
    if (selectedRows.size === validIndices.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(validIndices));
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Pacientes
          </CardTitle>
          <CardDescription>
            Descarga la lista de pacientes en formato CSV o Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportToCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Table2 className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Badge variant="secondary" className="self-center">
              {patients.length} pacientes
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Pacientes
          </CardTitle>
          <CardDescription>
            Carga pacientes desde un archivo CSV o Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Formato requerido</AlertTitle>
            <AlertDescription>
              El archivo debe contener las columnas: Nombre Completo, Email (obligatorios). 
              Opcionalmente: Teléfono, Género, Año Nacimiento, Dirección, Notas, Etiquetas.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
            
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button>
                <FileUp className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista previa de importación</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de importar. Los registros con errores están marcados en rojo.
            </DialogDescription>
          </DialogHeader>

          {importing ? (
            <div className="py-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Importando pacientes...</span>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {importProgress}% completado
              </p>
            </div>
          ) : importStats.total > 0 ? (
            <div className="py-8 space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">Importación completada</p>
                <p className="text-muted-foreground">
                  {importStats.success} de {importStats.total} pacientes importados correctamente
                </p>
                {importStats.failed > 0 && (
                  <p className="text-destructive">
                    {importStats.failed} registros fallaron
                  </p>
                )}
              </div>
              <div className="flex justify-center">
                <Button onClick={() => { setShowImportDialog(false); setImportStats({ total: 0, success: 0, failed: 0 }); setImportedData([]); }}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedRows.size === importedData.filter(p => p.isValid).length}
                    onCheckedChange={selectAllValid}
                  />
                  <span className="text-sm">Seleccionar todos los válidos</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{selectedRows.size} seleccionados</Badge>
                  <Badge variant="secondary">{importedData.filter(p => p.isValid).length} válidos</Badge>
                  <Badge variant="destructive">{importedData.filter(p => !p.isValid).length} con errores</Badge>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Año Nac.</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.map((patient, index) => (
                      <TableRow 
                        key={index} 
                        className={!patient.isValid ? "bg-destructive/10" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(index)}
                            onCheckedChange={() => toggleRowSelection(index)}
                            disabled={!patient.isValid}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{patient.full_name || '-'}</TableCell>
                        <TableCell>{patient.email || '-'}</TableCell>
                        <TableCell>{patient.phone || '-'}</TableCell>
                        <TableCell>{patient.gender || '-'}</TableCell>
                        <TableCell>{patient.birth_year || '-'}</TableCell>
                        <TableCell>
                          {patient.isValid ? (
                            <Badge variant="default" className="bg-green-500">Válido</Badge>
                          ) : (
                            <Badge variant="destructive" title={patient.errors.join(', ')}>
                              {patient.errors.length} error(es)
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={importPatients} 
                  disabled={selectedRows.size === 0}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Importar {selectedRows.size} Pacientes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
