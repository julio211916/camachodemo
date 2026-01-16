import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  History, FileEdit, Heart, Stethoscope, ClipboardList, 
  Image, Pill, FileText, FileSignature, Smile, Layers
} from "lucide-react";

// Sub-modules
import { 
  PatientHistorySection,
  PatientEvolutionsSection,
  PatientMedicalHistorySection,
  PatientOdontogramSection,
  PatientPeriodontogramSection,
  PatientImagingSection,
  PatientPrescriptionsSection,
  PatientDocumentsSection,
  PatientConsentsSection
} from "./clinical";

interface PatientClinicalTabProps {
  patientId: string;
  patientName: string;
}

export const PatientClinicalTab = ({ patientId, patientName }: PatientClinicalTabProps) => {
  const [activeSection, setActiveSection] = useState("historial");

  const sections = [
    { id: "historial", label: "Historial", icon: History },
    { id: "evoluciones", label: "Evoluciones", icon: FileEdit },
    { id: "antecedentes", label: "Antecedentes Médicos", icon: Heart },
    { id: "odontograma", label: "Odontograma", icon: Stethoscope },
    { id: "periodontograma", label: "Periodontograma", icon: ClipboardList },
    { id: "rx-documentos", label: "Rx y Documentos", icon: Image },
    { id: "recetas", label: "Recetas", icon: Pill },
    { id: "documentos-clinicos", label: "Documentos Clínicos", icon: FileText },
    { id: "consentimientos", label: "Consentimientos", icon: FileSignature },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <ScrollArea className="w-full">
          <TabsList className="h-10 w-max gap-1 bg-muted/50 p-1">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.id}
                value={section.id}
                className="gap-2 data-[state=active]:bg-background whitespace-nowrap"
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="historial" className="mt-4">
          <PatientHistorySection patientId={patientId} />
        </TabsContent>

        <TabsContent value="evoluciones" className="mt-4">
          <PatientEvolutionsSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="antecedentes" className="mt-4">
          <PatientMedicalHistorySection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="odontograma" className="mt-4">
          <PatientOdontogramSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="periodontograma" className="mt-4">
          <PatientPeriodontogramSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="rx-documentos" className="mt-4">
          <PatientImagingSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="recetas" className="mt-4">
          <PatientPrescriptionsSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="documentos-clinicos" className="mt-4">
          <PatientDocumentsSection patientId={patientId} patientName={patientName} />
        </TabsContent>

        <TabsContent value="consentimientos" className="mt-4">
          <PatientConsentsSection patientId={patientId} patientName={patientName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
