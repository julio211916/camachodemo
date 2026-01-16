import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, Pill, Heart, Activity, Save, 
  Plus, X, Loader2, FileHeart
} from "lucide-react";

interface PatientMedicalHistorySectionProps {
  patientId: string;
  patientName: string;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const commonAlerts = [
  'Diabetes', 'Hipertensión', 'Cardiopatía', 'Asma', 'Epilepsia', 
  'Hemofilia', 'VIH', 'Hepatitis', 'Embarazo', 'Lactancia'
];

const commonDiseases = [
  'Amigdalitis de repetición', 'Tuberculosis', 'Fiebre reumática', 'Diabetes',
  'Enfermedades cardiovasculares', 'Artritis', 'Traumatismos con secuelas',
  'Intervenciones quirúrgicas', 'Transfusiones sanguíneas'
];

const hereditaryConditions = [
  'Diabetes', 'Hipertensión arterial', 'Cardiopatías', 'Neoplasias',
  'Epilepsia', 'Malformaciones', 'VIH', 'Enfermedades renales',
  'Hepatitis', 'Artritis', 'Aparentemente sano'
];

const nonPathological = [
  'Tabaco', 'Alcohol', 'Drogas', 'Farmacodependencias'
];

const dentalHistory = [
  'Cepillado frecuente', 'Usa hilo dental', 'Aplicación tópica de fluoruros',
  'Enjuagues con fluoruro', 'Autoaplicación de fluoruro'
];

export const PatientMedicalHistorySection = ({ patientId, patientName }: PatientMedicalHistorySectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    blood_type: '',
    allergies: [] as string[],
    conditions: [] as string[],
    medications: [] as string[],
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  // Fetch medical history
  const { data: medicalHistory, isLoading } = useQuery({
    queryKey: ['medical-history', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (medicalHistory) {
      setFormData({
        blood_type: medicalHistory.blood_type || '',
        allergies: medicalHistory.allergies || [],
        conditions: medicalHistory.conditions || [],
        medications: medicalHistory.medications || [],
        notes: medicalHistory.notes || '',
        emergency_contact_name: medicalHistory.emergency_contact_name || '',
        emergency_contact_phone: medicalHistory.emergency_contact_phone || ''
      });
    }
  }, [medicalHistory]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patient_id: patientId,
        ...formData
      };

      if (medicalHistory?.id) {
        const { error } = await supabase
          .from('medical_history')
          .update(payload)
          .eq('id', medicalHistory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_history')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-history', patientId] });
      toast({ title: "Guardado", description: "Antecedentes médicos actualizados" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addItem = (field: 'allergies' | 'conditions' | 'medications', value: string) => {
    if (!value.trim()) return;
    if (!formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
    }
  };

  const removeItem = (field: 'allergies' | 'conditions' | 'medications', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileHeart className="w-5 h-5" />
            Antecedentes Médicos
          </CardTitle>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Guardar</>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <Accordion type="multiple" defaultValue={['alerts', 'diseases', 'medications']} className="space-y-2">
            {/* Medical Alerts */}
            <AccordionItem value="alerts" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="font-medium">Alertas Médicas</span>
                  {formData.allergies.length > 0 && (
                    <Badge variant="destructive">{formData.allergies.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Select onValueChange={(v) => addItem('allergies', v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Añadir alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonAlerts.map(alert => (
                        <SelectItem key={alert} value={alert}>{alert}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Otra alerta..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('allergies', newAllergy);
                        setNewAllergy('');
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      addItem('allergies', newAllergy);
                      setNewAllergy('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map(allergy => (
                    <Badge key={allergy} variant="destructive" className="gap-1">
                      {allergy}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeItem('allergies', allergy)}
                      />
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Diseases */}
            <AccordionItem value="diseases" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="font-medium">Enfermedades</span>
                  {formData.conditions.length > 0 && (
                    <Badge>{formData.conditions.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Select onValueChange={(v) => addItem('conditions', v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Añadir enfermedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonDiseases.map(disease => (
                        <SelectItem key={disease} value={disease}>{disease}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Otra enfermedad..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('conditions', newCondition);
                        setNewCondition('');
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      addItem('conditions', newCondition);
                      setNewCondition('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.conditions.map(condition => (
                    <Badge key={condition} variant="secondary" className="gap-1">
                      {condition}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeItem('conditions', condition)}
                      />
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Medications */}
            <AccordionItem value="medications" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Medicamentos</span>
                  {formData.medications.length > 0 && (
                    <Badge>{formData.medications.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar medicamento..."
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('medications', newMedication);
                        setNewMedication('');
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      addItem('medications', newMedication);
                      setNewMedication('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.medications.map(medication => (
                    <Badge key={medication} variant="outline" className="gap-1">
                      {medication}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeItem('medications', medication)}
                      />
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Blood Type & Emergency Contact */}
            <AccordionItem value="general" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Información General</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de Sangre</Label>
                    <Select 
                      value={formData.blood_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, blood_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contacto de Emergencia</Label>
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                      placeholder="Nombre del contacto"
                    />
                  </div>
                  <div>
                    <Label>Teléfono de Emergencia</Label>
                    <Input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Notes */}
            <AccordionItem value="notes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-medium">Comentarios</span>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el historial médico..."
                  rows={4}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
