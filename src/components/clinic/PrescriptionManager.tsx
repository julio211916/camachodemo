import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Pill, 
  Plus, 
  Printer, 
  FileText, 
  Clock,
  User,
  Calendar,
  Trash2,
  Download,
  Loader2,
  Search,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import logo from "@/assets/logo-novelldent.png";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  date: Date;
  medications: Medication[];
  diagnosis: string;
  notes: string;
}

interface PrescriptionManagerProps {
  patientId?: string;
  patientName?: string;
  doctorName?: string;
}

export const PrescriptionManager = ({ patientId, patientName, doctorName }: PrescriptionManagerProps) => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  
  const [formData, setFormData] = useState({
    diagnosis: "",
    notes: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }] as Medication[],
  });

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...formData.medications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, medications: updated });
  };

  const handleSave = () => {
    if (!formData.medications.some(m => m.name)) {
      toast({ title: "Error", description: "Agrega al menos un medicamento", variant: "destructive" });
      return;
    }

    const newPrescription: Prescription = {
      id: Date.now().toString(),
      patientName: patientName || "Paciente",
      doctorName: doctorName || "Doctor",
      date: new Date(),
      medications: formData.medications.filter(m => m.name),
      diagnosis: formData.diagnosis,
      notes: formData.notes,
    };

    setPrescriptions([newPrescription, ...prescriptions]);
    setFormData({
      diagnosis: "",
      notes: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    });
    setIsDialogOpen(false);
    toast({ title: "Receta creada", description: "La receta se ha guardado correctamente." });
  };

  const printPrescription = (prescription: Prescription) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receta Médica - NovellDent</title>
        <style>
          body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-width: 150px; }
          .title { color: #1a5f7a; font-size: 24px; margin: 10px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .label { color: #666; font-size: 12px; }
          .value { font-weight: bold; }
          .medications { margin: 30px 0; }
          .medication { padding: 15px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 8px; }
          .medication-name { font-size: 18px; font-weight: bold; color: #1a5f7a; }
          .medication-details { color: #333; margin-top: 5px; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }
          .signature { margin-top: 60px; text-align: center; }
          .signature-line { width: 200px; border-top: 1px solid #000; margin: 0 auto; padding-top: 10px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">NovellDent</h1>
          <p style="color: #666;">Clínica Dental - Receta Médica</p>
        </div>
        
        <div class="info-row">
          <div><span class="label">Paciente:</span> <span class="value">${prescription.patientName}</span></div>
          <div><span class="label">Fecha:</span> <span class="value">${format(prescription.date, "d 'de' MMMM, yyyy", { locale: es })}</span></div>
        </div>
        
        <div class="info-row">
          <div><span class="label">Doctor:</span> <span class="value">${prescription.doctorName}</span></div>
        </div>
        
        ${prescription.diagnosis ? `<div style="margin: 20px 0;"><span class="label">Diagnóstico:</span><p class="value">${prescription.diagnosis}</p></div>` : ''}
        
        <div class="medications">
          <h3 style="color: #1a5f7a; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Medicamentos Prescritos</h3>
          ${prescription.medications.map(med => `
            <div class="medication">
              <div class="medication-name">${med.name}</div>
              <div class="medication-details">
                <strong>Dosis:</strong> ${med.dosage} | 
                <strong>Frecuencia:</strong> ${med.frequency} | 
                <strong>Duración:</strong> ${med.duration}
              </div>
              ${med.instructions ? `<div class="medication-details" style="margin-top: 5px;"><strong>Instrucciones:</strong> ${med.instructions}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        ${prescription.notes ? `<div style="margin: 20px 0; background: #f5f5f5; padding: 15px; border-radius: 8px;"><span class="label">Notas adicionales:</span><p>${prescription.notes}</p></div>` : ''}
        
        <div class="signature">
          <div class="signature-line">
            ${prescription.doctorName}
            <br><small style="color: #666;">Firma del Médico</small>
          </div>
        </div>
        
        <div class="footer">
          <p style="font-size: 12px; color: #666;">NovellDent - Sonrisas que Transforman Vidas</p>
          <p style="font-size: 11px; color: #999;">Tel: +52 322 183 7666 | www.novelldent.com</p>
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

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medications.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Recetario Médico
            {patientName && <Badge variant="secondary">{patientName}</Badge>}
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Receta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Receta</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground">Paciente</Label>
                    <p className="font-medium">{patientName || "Seleccionar paciente"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Doctor</Label>
                    <p className="font-medium">{doctorName || "Doctor"}</p>
                  </div>
                </div>
                
                {/* Diagnosis */}
                <div>
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Describe el diagnóstico del paciente..."
                    rows={2}
                  />
                </div>
                
                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Medicamentos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.medications.map((med, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary">Medicamento {index + 1}</span>
                          {formData.medications.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeMedication(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label>Nombre del Medicamento</Label>
                            <Input
                              value={med.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              placeholder="Ej: Ibuprofeno 400mg"
                            />
                          </div>
                          <div>
                            <Label>Dosis</Label>
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                              placeholder="Ej: 1 tableta"
                            />
                          </div>
                          <div>
                            <Label>Frecuencia</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                              placeholder="Ej: Cada 8 horas"
                            />
                          </div>
                          <div>
                            <Label>Duración</Label>
                            <Input
                              value={med.duration}
                              onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                              placeholder="Ej: 7 días"
                            />
                          </div>
                          <div>
                            <Label>Instrucciones</Label>
                            <Input
                              value={med.instructions}
                              onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                              placeholder="Ej: Después de comer"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instrucciones especiales, advertencias, etc..."
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Guardar Receta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay recetas creadas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Haz clic en "Nueva Receta" para crear una
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{prescription.patientName}</span>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(prescription.date, "d MMM yyyy", { locale: es })}
                      </Badge>
                    </div>
                    
                    {prescription.diagnosis && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Diagnóstico:</strong> {prescription.diagnosis}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {prescription.medications.map((med, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <Pill className="w-3 h-3" />
                          {med.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => printPrescription(prescription)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
