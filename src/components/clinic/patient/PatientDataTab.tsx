import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Mail, Phone, MapPin, Calendar, Save, Edit2, Camera, 
  Building2, Briefcase, UserCircle, CreditCard, Users, Tag
} from "lucide-react";

interface PatientDataTabProps {
  patient: any;
  onUpdate: (data: any) => void;
}

export const PatientDataTab = ({ patient, onUpdate }: PatientDataTabProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: patient.fullName || "",
    email: patient.email || "",
    phone: patient.phone || "",
    address: patient.address || "",
    gender: patient.gender || "",
    date_of_birth: patient.dateOfBirth || "",
    curp_rfc: patient.curpRfc || "",
    occupation: patient.occupation || "",
    employer: patient.employer || "",
    beneficiary_type: patient.beneficiaryType || "",
    guardian_name: patient.guardianName || "",
    internal_number: patient.internalNumber || "",
    notes: patient.notes || "",
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
    toast({ title: "Datos actualizados", description: "Los datos del paciente han sido guardados." });
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info Card */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Datos generales del paciente</CardDescription>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2">
                  <AvatarImage src={patient.avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {patient.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo</Label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{patient.fullName}</p>
                  )}
                </div>
                <div>
                  <Label>CURP / RFC</Label>
                  {isEditing ? (
                    <Input
                      value={formData.curp_rfc}
                      onChange={(e) => setFormData({ ...formData, curp_rfc: e.target.value })}
                      placeholder="CURP o RFC"
                    />
                  ) : (
                    <p className="text-sm mt-1 font-mono">{patient.curpRfc || "--"}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{patient.email}</p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Teléfono
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{patient.phone || "No registrado"}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Dirección
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{patient.address || "No registrada"}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Fecha de Nacimiento
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('es-MX') : "No registrada"}
                  </p>
                )}
              </div>
              <div>
                <Label>Género</Label>
                {isEditing ? (
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 capitalize">
                    {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : patient.gender || 'No registrado'}
                  </p>
                )}
              </div>
              <div>
                <Label>Tipo de Beneficiario</Label>
                {isEditing ? (
                  <Select value={formData.beneficiary_type} onValueChange={(v) => setFormData({ ...formData, beneficiary_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="titular">Titular</SelectItem>
                      <SelectItem value="dependiente">Dependiente</SelectItem>
                      <SelectItem value="convenio">Convenio</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 capitalize">{patient.beneficiaryType || "No especificado"}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Employment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Ocupación
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{patient.occupation || "No registrada"}</p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Empleador / Empresa
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.employer}
                    onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{patient.employer || "No registrado"}</p>
                )}
              </div>
            </div>

            {/* Guardian Info */}
            <div>
              <Label className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                Tutor / Responsable (para menores de edad)
              </Label>
              {isEditing ? (
                <Input
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  placeholder="Nombre del tutor"
                />
              ) : (
                <p className="text-sm mt-1">{patient.guardianName || "No aplica"}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label>Notas / Observaciones</Label>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">
                  {patient.notes || "Sin notas"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* ID Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Identificación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">ID Paciente</Label>
              <p className="font-mono text-sm">{patient.patientCode || patient.id?.slice(0, 8)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Número Interno</Label>
              <p className="font-mono text-sm">{patient.internalNumber || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Código de Referido</Label>
              <Badge variant="secondary">{patient.referralCode || "Sin código"}</Badge>
            </div>
            {patient.referralDiscountPercent > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Descuento por Referidos</Label>
                <Badge className="bg-green-500/10 text-green-600">
                  {patient.referralDiscountPercent}% descuento
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patient.tags?.length > 0 ? (
                patient.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin etiquetas</p>
              )}
              <Button variant="ghost" size="sm" className="h-6 px-2">
                + Agregar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Convention / Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Convenio / Seguro
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.conventionId ? (
              <div className="space-y-2">
                <Badge variant="secondary">Convenio Activo</Badge>
                <p className="text-sm text-muted-foreground">Descuento aplicado automáticamente</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sin convenio asignado</p>
                <Button variant="outline" size="sm">Asignar Convenio</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de registro</span>
              <span>{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('es-MX') : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última actualización</span>
              <span>{patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('es-MX') : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última visita</span>
              <span>{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('es-MX') : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
