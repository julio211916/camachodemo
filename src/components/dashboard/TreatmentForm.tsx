import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, FileText, Calendar, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TreatmentFormProps {
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TreatmentForm = ({ doctorId, isOpen, onClose }: TreatmentFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    patient_id: "",
    name: "",
    description: "",
    diagnosis: "",
    treatment_plan: "",
    cost: "",
    status: "in_progress",
  });

  // Fetch profiles to get list of patients
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-treatment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createTreatmentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('treatments')
        .insert({
          doctor_id: doctorId,
          patient_id: formData.patient_id,
          name: formData.name,
          description: formData.description || null,
          diagnosis: formData.diagnosis || null,
          treatment_plan: formData.treatment_plan || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          status: formData.status,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-treatments'] });
      toast({
        title: "Tratamiento creado",
        description: "El tratamiento se ha registrado correctamente.",
      });
      onClose();
      setFormData({
        patient_id: "",
        name: "",
        description: "",
        diagnosis: "",
        treatment_plan: "",
        cost: "",
        status: "in_progress",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el tratamiento.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.name) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona un paciente e ingresa el nombre del tratamiento.",
        variant: "destructive",
      });
      return;
    }
    createTreatmentMutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Nuevo Tratamiento
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Paciente *
                    </Label>
                    <Select
                      value={formData.patient_id}
                      onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.full_name} - {profile.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Treatment Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Tratamiento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Limpieza dental profunda"
                      className="h-12"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción detallada del tratamiento..."
                      rows={3}
                    />
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnóstico</Label>
                    <Textarea
                      id="diagnosis"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      placeholder="Diagnóstico inicial..."
                      rows={2}
                    />
                  </div>

                  {/* Treatment Plan */}
                  <div className="space-y-2">
                    <Label htmlFor="treatment_plan">Plan de Tratamiento</Label>
                    <Textarea
                      id="treatment_plan"
                      value={formData.treatment_plan}
                      onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                      placeholder="Pasos del tratamiento..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Cost */}
                    <div className="space-y-2">
                      <Label htmlFor="cost" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Costo (€)
                      </Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        className="h-12"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTreatmentMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      {createTreatmentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Crear Tratamiento
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
