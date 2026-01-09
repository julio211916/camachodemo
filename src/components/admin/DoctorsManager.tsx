import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  UserPlus,
  Pencil,
  Power,
  Search,
  Loader2,
  Stethoscope,
  User,
  Clock,
  DollarSign,
  X,
  Save,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string;
  bio: string | null;
  consultation_fee: number | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  is_active: boolean | null;
  available_days: string[] | null;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface DoctorFormData {
  user_id: string;
  specialty: string;
  license_number: string;
  bio: string;
  consultation_fee: string;
  working_hours_start: string;
  working_hours_end: string;
  is_active: boolean;
  available_days: string[];
}

const WEEKDAYS = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const SPECIALTIES = [
  "Odontología General",
  "Ortodoncia",
  "Periodoncia",
  "Endodoncia",
  "Implantología",
  "Estética Dental",
  "Odontopediatría",
  "Cirugía Oral",
];

export const DoctorsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    user_id: "",
    specialty: "",
    license_number: "",
    bio: "",
    consultation_fee: "",
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    is_active: true,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });

  // Fetch all doctors with their profiles
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data: doctorsData, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each doctor
      const doctorsWithProfiles = await Promise.all(
        doctorsData.map(async (doctor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("user_id", doctor.user_id)
            .single();

          return { ...doctor, profile };
        })
      );

      return doctorsWithProfiles as Doctor[];
    },
  });

  // Fetch users without doctor role for adding new doctors
  const { data: availableUsers = [] } = useQuery({
    queryKey: ["available-users-for-doctor"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      const { data: existingDoctors } = await supabase
        .from("doctors")
        .select("user_id");

      const existingUserIds = new Set(existingDoctors?.map((d) => d.user_id) || []);
      return profiles?.filter((p) => !existingUserIds.has(p.user_id)) || [];
    },
    enabled: isFormOpen && !editingDoctor,
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async () => {
      // First add doctor role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: formData.user_id,
        role: "doctor",
      });

      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      // Then create doctor record
      const { error } = await supabase.from("doctors").insert({
        user_id: formData.user_id,
        specialty: formData.specialty,
        license_number: formData.license_number,
        bio: formData.bio || null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        working_hours_start: formData.working_hours_start,
        working_hours_end: formData.working_hours_end,
        is_active: formData.is_active,
        available_days: formData.available_days,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["available-users-for-doctor"] });
      toast({ title: "Doctor agregado correctamente" });
      closeForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update doctor mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!editingDoctor) return;
      
      const { error } = await supabase
        .from("doctors")
        .update({
          specialty: formData.specialty,
          license_number: formData.license_number,
          bio: formData.bio || null,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
          working_hours_start: formData.working_hours_start,
          working_hours_end: formData.working_hours_end,
          is_active: formData.is_active,
          available_days: formData.available_days,
        })
        .eq("id", editingDoctor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast({ title: "Doctor actualizado correctamente" });
      closeForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle doctor status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("doctors")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const openEditForm = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      user_id: doctor.user_id,
      specialty: doctor.specialty,
      license_number: doctor.license_number,
      bio: doctor.bio || "",
      consultation_fee: doctor.consultation_fee?.toString() || "",
      working_hours_start: doctor.working_hours_start || "09:00",
      working_hours_end: doctor.working_hours_end || "18:00",
      is_active: doctor.is_active ?? true,
      available_days: doctor.available_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDoctor(null);
    setFormData({
      user_id: "",
      specialty: "",
      license_number: "",
      bio: "",
      consultation_fee: "",
      working_hours_start: "09:00",
      working_hours_end: "18:00",
      is_active: true,
      available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.specialty || !formData.license_number) {
      toast({
        title: "Campos requeridos",
        description: "Especialidad y número de licencia son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    if (editingDoctor) {
      updateDoctorMutation.mutate();
    } else {
      if (!formData.user_id) {
        toast({
          title: "Selecciona un usuario",
          description: "Debes seleccionar un usuario para crear el doctor.",
          variant: "destructive",
        });
        return;
      }
      createDoctorMutation.mutate();
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.license_number.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-primary" />
          Gestión de Doctores
        </h2>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Agregar Doctor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, especialidad o licencia..."
          className="pl-12 h-12 rounded-xl"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctors.length}</p>
                <p className="text-sm text-muted-foreground">Total Doctores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Power className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctors.filter((d) => d.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Power className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctors.filter((d) => !d.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-20">
          <Stethoscope className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay doctores</h3>
          <p className="text-muted-foreground">Agrega el primer doctor al sistema.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-all hover:shadow-lg",
                  !doctor.is_active && "opacity-60"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            Dr. {doctor.profile?.full_name || "Sin nombre"}
                          </h3>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        </div>
                      </div>
                      <Badge variant={doctor.is_active ? "default" : "secondary"}>
                        {doctor.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Stethoscope className="w-4 h-4" />
                        <span>Licencia: {doctor.license_number}</span>
                      </div>
                      {doctor.profile?.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{doctor.profile.email}</span>
                        </div>
                      )}
                      {doctor.working_hours_start && doctor.working_hours_end && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{doctor.working_hours_start} - {doctor.working_hours_end}</span>
                        </div>
                      )}
                      {doctor.consultation_fee && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>€{doctor.consultation_fee}/consulta</span>
                        </div>
                      )}
                    </div>

                    {doctor.available_days && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {doctor.available_days.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {WEEKDAYS.find((w) => w.value === day)?.label.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(doctor)}
                        className="flex-1 gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant={doctor.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ id: doctor.id, isActive: !doctor.is_active })}
                        disabled={toggleStatusMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <Power className="w-4 h-4" />
                        {doctor.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {editingDoctor ? "Editar Doctor" : "Agregar Doctor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* User Selection (only for new doctors) */}
            {!editingDoctor && (
              <div className="space-y-2">
                <Label>Usuario *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidad *</Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de Licencia *</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Ej: COL-12345"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Biografía</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Información profesional del doctor..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tarifa de Consulta (€)</Label>
                <Input
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                  placeholder="0.00"
                  className="h-12"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={formData.working_hours_start}
                  onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={formData.working_hours_end}
                  onChange={(e) => setFormData({ ...formData, working_hours_end: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Días Disponibles</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.available_days.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Doctor Activo</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createDoctorMutation.isPending || updateDoctorMutation.isPending}
                className="flex-1 gap-2"
              >
                {(createDoctorMutation.isPending || updateDoctorMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingDoctor ? "Actualizar" : "Agregar"} Doctor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
