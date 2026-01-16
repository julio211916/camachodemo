import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Pill, Plus, Printer, Eye, XCircle, Book, 
  Loader2, Bold, Italic, Underline, List, ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientPrescriptionsSectionProps {
  patientId: string;
  patientName: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export const PatientPrescriptionsSection = ({ patientId, patientName }: PatientPrescriptionsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [showCancelled, setShowCancelled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vademecumOpen, setVademecumOpen] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<any>(null);
  const [prescriptionHtml, setPrescriptionHtml] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("");

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_prescriptions')
        .select('*, doctor:doctors(specialty)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch vademecum
  const { data: vademecum = [] } = useQuery({
    queryKey: ['vademecum'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vademecum')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch treatments for filter
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments-list', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, name, treatment_type')
        .eq('patient_id', patientId);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch prescription templates
  const { data: templates = [] } = useQuery({
    queryKey: ['prescription-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', 'prescription')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }
  });

  // Create prescription mutation
  const createPrescription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('patient_prescriptions').insert([{
        patient_id: patientId,
        prescription_html: prescriptionHtml,
        medications: medications as any,
        treatment_id: treatmentFilter || null
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', patientId] });
      toast({ title: "Receta creada" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Cancel prescription
  const cancelPrescription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_prescriptions')
        .update({ 
          is_cancelled: true, 
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', patientId] });
      toast({ title: "Receta anulada" });
    }
  });

  const resetForm = () => {
    setPrescriptionHtml("");
    setMedications([]);
    setSelectedTemplate("");
    setTreatmentFilter("");
  };

  const addMedication = (med?: any) => {
    const newMed: Medication = med ? {
      name: med.name,
      dosage: med.dosage || '',
      frequency: '',
      duration: '',
      notes: med.indications || ''
    } : {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    };
    setMedications([...medications, newMed]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setPrescriptionHtml(template.content);
    }
    setSelectedTemplate(templateId);
  };

  const generateHtml = (): string => {
    let html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Receta Médica</h2>
      <p><strong>Paciente:</strong> ${patientName}</p>
      <p><strong>Fecha:</strong> ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
      <hr/>
      <h3>Medicamentos:</h3>
      <ul>`;
    
    medications.forEach(med => {
      html += `<li>
        <strong>${med.name}</strong> - ${med.dosage}<br/>
        ${med.frequency} por ${med.duration}<br/>
        ${med.notes ? `<em>${med.notes}</em>` : ''}
      </li>`;
    });
    
    html += '</ul></div>';
    return html;
  };

  const printPrescription = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Receta - ${patientName}</title></head>
          <body>${prescription.prescription_html}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredPrescriptions = prescriptions.filter((p: any) => {
    if (!showCancelled && p.is_cancelled) return false;
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Recetas
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tratamientos</SelectItem>
                  {treatments.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name || t.treatment_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="show-cancelled-rx"
                  checked={showCancelled}
                  onCheckedChange={setShowCancelled}
                />
                <Label htmlFor="show-cancelled-rx" className="text-sm">Mostrar anuladas</Label>
              </div>

              <Button variant="outline" onClick={() => setVademecumOpen(true)}>
                <Book className="w-4 h-4 mr-2" />
                Vademécum
              </Button>

              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Receta
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Este tratamiento no tiene recetas</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Crear primera receta
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {filteredPrescriptions.map((prescription: any) => (
                  <Card 
                    key={prescription.id}
                    className={cn(
                      "transition-colors",
                      prescription.is_cancelled && "opacity-60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {format(new Date(prescription.created_at), "d MMM yyyy", { locale: es })}
                            </Badge>
                            {prescription.is_cancelled && (
                              <Badge variant="destructive">Anulada</Badge>
                            )}
                          </div>
                          
                          {Array.isArray(prescription.medications) && prescription.medications.length > 0 && (
                            <div className="space-y-1">
                              {(prescription.medications as Medication[]).slice(0, 3).map((med: Medication, i: number) => (
                                <p key={i} className="text-sm">
                                  <span className="font-medium">{med.name}</span>
                                  {med.dosage && ` - ${med.dosage}`}
                                </p>
                              ))}
                              {prescription.medications.length > 3 && (
                                <p className="text-sm text-muted-foreground">
                                  +{prescription.medications.length - 3} más...
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setViewPrescription(prescription)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => printPrescription(prescription)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {!prescription.is_cancelled && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => cancelPrescription.mutate(prescription.id)}
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

      {/* Create Prescription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Receta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Usar plantilla</Label>
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
              <div className="flex-1">
                <Label>Asociar a tratamiento</Label>
                <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatments.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.treatment_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Medications List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medicamentos</Label>
                <Button variant="outline" size="sm" onClick={() => addMedication()}>
                  <Plus className="w-3 h-3 mr-1" /> Agregar
                </Button>
              </div>
              
              {medications.map((med, index) => (
                <Card key={index} className="mb-2">
                  <CardContent className="p-3 grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Medicamento"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Dosis"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    />
                    <Input
                      placeholder="Frecuencia"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    />
                    <div className="flex gap-1">
                      <Input
                        placeholder="Duración"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeMedication(index)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rich Text Editor (simplified) */}
            <div>
              <Label>Contenido adicional</Label>
              <div className="border rounded-lg">
                <div className="flex gap-1 p-2 border-b bg-muted/50">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={prescriptionHtml}
                  onChange={(e) => setPrescriptionHtml(e.target.value)}
                  placeholder="Indicaciones adicionales..."
                  rows={6}
                  className="border-0 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setPrescriptionHtml(generateHtml());
                createPrescription.mutate();
              }}
              disabled={medications.length === 0 || createPrescription.isPending}
            >
              {createPrescription.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</>
              ) : (
                'Crear Receta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={!!viewPrescription} onOpenChange={() => setViewPrescription(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receta</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: viewPrescription?.prescription_html || '' }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPrescription(null)}>
              Cerrar
            </Button>
            <Button onClick={() => printPrescription(viewPrescription)}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vademecum Dialog */}
      <Dialog open={vademecumOpen} onOpenChange={setVademecumOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Vademécum</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Indicaciones</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vademecum.map((med: any) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>{med.presentation}</TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell className="max-w-xs truncate">{med.indications}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          addMedication(med);
                          setVademecumOpen(false);
                          setDialogOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Agregar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
