import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export const PatientHistorySection = ({ patientId }: { patientId: string }) => (
  <Card className="p-8 text-center">
    <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
    <p className="text-muted-foreground">Historial del paciente - En desarrollo</p>
  </Card>
);

export const PatientEvolutionsSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Evoluciones clínicas - En desarrollo</p>
  </Card>
);

export const PatientMedicalHistorySection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Antecedentes médicos - En desarrollo</p>
  </Card>
);

export const PatientOdontogramSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Odontograma - En desarrollo</p>
  </Card>
);

export const PatientPeriodontogramSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Periodontograma - En desarrollo</p>
  </Card>
);

export const PatientImagingSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Rx y Documentos - En desarrollo</p>
  </Card>
);

export const PatientPrescriptionsSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Recetas - En desarrollo</p>
  </Card>
);

export const PatientDocumentsSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Documentos clínicos - En desarrollo</p>
  </Card>
);

export const PatientConsentsSection = ({ patientId, patientName }: { patientId: string; patientName: string }) => (
  <Card className="p-8 text-center">
    <p className="text-muted-foreground">Consentimientos - En desarrollo</p>
  </Card>
);
