import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, FileText, Stethoscope, Box, Heart, CreditCard,
  Phone, Mail, MapPin, Clock, Activity, TrendingUp, AlertTriangle,
  ChevronLeft, Printer, Download, Edit2, Plus, History, Loader2,
  Upload, Image, Pill, FileSignature, Smile, Layers, Baby, Share2,
  RefreshCw, Filter, Search, MoreVertical, Eye, Trash2, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { QRCodeSVG } from "qrcode.react";

// Clinical Modules
import { PatientDataTab } from "./PatientDataTab";
import { PatientClinicalTab } from "./PatientClinicalTab";
import { PatientTreatmentPlansTab } from "./PatientTreatmentPlansTab";
import { PatientBillingTab } from "./PatientBillingTab";
import { AppointmentModal } from "./AppointmentModal";

interface PatientClinicalRecordProps {
  patientId?: string;
  onBack?: () => void;
}

export const PatientClinicalRecord = ({ patientId, onBack }: PatientClinicalRecordProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("datos-personales");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  const { patient, treatments, appointments, invoices, stats, isLoading, updatePatient } = usePatientProfile(patientId);

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const patientUrl = `${window.location.origin}/portal?patient=${patientId}`;

  const handlePrintHistory = () => {
    toast({ title: "Generando historia clínica...", description: "El documento se está preparando para imprimir." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando perfil...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Paciente no encontrado</h2>
          <p className="text-muted-foreground">Selecciona un paciente desde la lista.</p>
          {onBack && (
            <Button onClick={onBack} className="mt-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver a Pacientes
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Patient Banner - Fixed Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left - Patient Info */}
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <Avatar className="w-16 h-16 border-2 border-primary cursor-pointer" onClick={() => setShowQRModal(true)}>
                <AvatarImage src={patient.avatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 font-bold">
                  {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{patient.fullName}</h1>
                  <Badge variant="outline" className="font-mono text-xs">
                    ID: {patient.id?.slice(0, 8)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  {patient.dateOfBirth && (
                    <span>{getAge(patient.dateOfBirth)} años</span>
                  )}
                  {patient.gender && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : patient.gender}</span>
                    </>
                  )}
                </div>
                {/* Tags */}
                <div className="flex gap-2 mt-1 flex-wrap">
                  {patient.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Medical Alerts & Actions */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Medical Alerts */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={patient.allergies?.length > 0 ? 'border-red-500 text-red-500' : ''}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Alertas: {patient.allergies?.length || 0}
                </Badge>
                <Badge variant="outline" className={patient.conditions?.length > 0 ? 'border-yellow-500 text-yellow-500' : ''}>
                  <Heart className="w-3 h-3 mr-1" />
                  Enfermedades: {patient.conditions?.length || 0}
                </Badge>
                <Badge variant="outline" className={patient.medications?.length > 0 ? 'border-blue-500 text-blue-500' : ''}>
                  <Pill className="w-3 h-3 mr-1" />
                  Medicamentos: {patient.medications?.length || 0}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQRModal(true)}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintHistory}>
                  <Printer className="w-4 h-4 mr-2" />
                  Historia Clínica
                </Button>
                <Button size="sm" onClick={() => setShowAppointmentModal(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="h-12 w-full justify-start gap-1 bg-transparent border-b rounded-none p-0">
            <TabsTrigger 
              value="datos-personales" 
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <User className="w-4 h-4" />
              Datos personales
            </TabsTrigger>
            <TabsTrigger 
              value="ficha-clinica"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Stethoscope className="w-4 h-4" />
              Ficha clínica
            </TabsTrigger>
            <TabsTrigger 
              value="planes-tratamiento"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Activity className="w-4 h-4" />
              Planes de tratamiento
            </TabsTrigger>
            <TabsTrigger 
              value="facturacion"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <CreditCard className="w-4 h-4" />
              Facturación y pagos
            </TabsTrigger>
            <TabsTrigger 
              value="recibir-pago"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-green-500/10 text-green-600 data-[state=active]:text-green-600"
            >
              <CreditCard className="w-4 h-4" />
              Recibir pago
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Contents */}
        <div className="mt-4">
          <TabsContent value="datos-personales" className="mt-0">
            <PatientDataTab patient={patient} onUpdate={updatePatient.mutate} />
          </TabsContent>

          <TabsContent value="ficha-clinica" className="mt-0">
            <PatientClinicalTab patientId={patient.id} patientName={patient.fullName} />
          </TabsContent>

          <TabsContent value="planes-tratamiento" className="mt-0">
            <PatientTreatmentPlansTab patientId={patient.id} treatments={treatments} />
          </TabsContent>

          <TabsContent value="facturacion" className="mt-0">
            <PatientBillingTab 
              patientId={patient.id} 
              invoices={invoices.map(inv => ({
                ...inv,
                items: inv.items.map(item => ({
                  description: item.description,
                  quantity: 1,
                  unitPrice: item.amount,
                  total: item.amount
                }))
              }))} 
              stats={{
                totalCost: stats.totalTreatmentCost,
                totalPaid: stats.totalPaid,
                balance: stats.balance,
                pendingBalance: stats.pendingBalance,
                paymentProgress: stats.paymentProgress
              }} 
            />
          </TabsContent>

          <TabsContent value="recibir-pago" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Recibir Pago</CardTitle>
                <CardDescription>Registra un nuevo pago del paciente</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Payment form will go here */}
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Módulo de recepción de pagos</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Código QR del Paciente
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{patient.fullName}</h3>
              <p className="text-sm text-muted-foreground">{patient.email}</p>
              {patient.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG
                value={patientUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">ID: {patientId}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(patientUrl);
                toast({ title: "Enlace copiado" });
              }}>
                Copiar enlace
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Modal */}
      <AppointmentModal
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
        patientId={patient.id}
        patientName={patient.fullName}
        patientEmail={patient.email}
        patientPhone={patient.phone}
      />
    </div>
  );
};
