import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, X, AlertTriangle, Pill, Heart, Phone } from "lucide-react";

interface MedicalHistoryProps {
  patientId: string;
  patientName?: string;
  readOnly?: boolean;
}

export const MedicalHistory = ({ patientId, patientName, readOnly = false }: MedicalHistoryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    blood_type: "",
    allergies: [] as string[],
    conditions: [] as string[],
    medications: [] as string[],
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: ['medical-history', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFormData({
          blood_type: data.blood_type || "",
          allergies: data.allergies || [],
          conditions: data.conditions || [],
          medications: data.medications || [],
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          notes: data.notes || "",
        });
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('medical_history')
        .upsert({
          patient_id: patientId,
          ...formData,
        }, {
          onConflict: 'patient_id'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-history', patientId] });
      toast({ title: "Guardado", description: "Historia clínica actualizada" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    },
  });

  const addItem = (type: 'allergies' | 'conditions' | 'medications', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()],
    }));
    if (type === 'allergies') setNewAllergy("");
    if (type === 'conditions') setNewCondition("");
    if (type === 'medications') setNewMedication("");
  };

  const removeItem = (type: 'allergies' | 'conditions' | 'medications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Historia Clínica {patientName && `- ${patientName}`}
        </CardTitle>
        {!readOnly && (
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => isEditing ? saveMutation.mutate() : setIsEditing(true)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Guardar" : "Editar"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blood Type */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            🩸 Tipo de Sangre
          </label>
          {isEditing ? (
            <Input
              value={formData.blood_type}
              onChange={(e) => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
              placeholder="Ej: O+, A-, B+..."
              className="mt-1 max-w-xs"
            />
          ) : (
            <p className="mt-1 text-lg font-semibold text-primary">
              {formData.blood_type || "No registrado"}
            </p>
          )}
        </div>

        {/* Allergies */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Alergias
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.allergies.map((allergy, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {allergy}
                {isEditing && (
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('allergies', index)} />
                )}
              </Badge>
            ))}
            {formData.allergies.length === 0 && !isEditing && (
              <span className="text-muted-foreground">Sin alergias registradas</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Nueva alergia..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('allergies', newAllergy))}
              />
              <Button size="sm" onClick={() => addItem('allergies', newAllergy)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Condiciones Médicas
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.conditions.map((condition, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {condition}
                {isEditing && (
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('conditions', index)} />
                )}
              </Badge>
            ))}
            {formData.conditions.length === 0 && !isEditing && (
              <span className="text-muted-foreground">Sin condiciones registradas</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Nueva condición..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('conditions', newCondition))}
              />
              <Button size="sm" onClick={() => addItem('conditions', newCondition)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Medications */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-500" />
            Medicamentos Actuales
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.medications.map((medication, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-800 flex items-center gap-1">
                {medication}
                {isEditing && (
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('medications', index)} />
                )}
              </Badge>
            ))}
            {formData.medications.length === 0 && !isEditing && (
              <span className="text-muted-foreground">Sin medicamentos registrados</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Nuevo medicamento..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('medications', newMedication))}
              />
              <Button size="sm" onClick={() => addItem('medications', newMedication)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              Contacto de Emergencia
            </label>
            {isEditing ? (
              <Input
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                placeholder="Nombre del contacto"
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{formData.emergency_contact_name || "No registrado"}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Teléfono de Emergencia</label>
            {isEditing ? (
              <Input
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                placeholder="Teléfono"
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{formData.emergency_contact_phone || "No registrado"}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Notas Adicionales</label>
          {isEditing ? (
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones generales sobre el paciente..."
              className="mt-1"
              rows={4}
            />
          ) : (
            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
              {formData.notes || "Sin notas adicionales"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
