import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Loader2, Check, Shuffle, Database,
  Calendar, FileText, DollarSign, Stethoscope
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

// Demo data generators
const FIRST_NAMES = [
  'María', 'José', 'Ana', 'Carlos', 'Laura', 'Miguel', 'Patricia', 'Juan',
  'Sofía', 'Pedro', 'Carmen', 'Luis', 'Isabel', 'Antonio', 'Gabriela', 'Fernando',
  'Rosa', 'Manuel', 'Elena', 'Francisco', 'Lucía', 'Alejandro', 'Teresa', 'Rodrigo'
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales',
  'Reyes', 'Cruz', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Mendoza', 'Ruiz', 'Aguilar'
];

const CITIES = [
  'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana',
  'León', 'Juárez', 'Mérida', 'Cancún', 'Querétaro'
];

const SERVICES = [
  { id: 'limpieza', name: 'Limpieza Dental', duration: 30, cost: 500 },
  { id: 'blanqueamiento', name: 'Blanqueamiento', duration: 60, cost: 2500 },
  { id: 'ortodoncia', name: 'Consulta Ortodoncia', duration: 45, cost: 800 },
  { id: 'endodoncia', name: 'Endodoncia', duration: 90, cost: 3500 },
  { id: 'extraccion', name: 'Extracción Simple', duration: 30, cost: 1000 },
  { id: 'implante', name: 'Valoración Implante', duration: 45, cost: 1500 },
  { id: 'revision', name: 'Revisión General', duration: 30, cost: 400 }
];

const TREATMENT_NAMES = [
  'Tratamiento de conductos', 'Brackets metálicos', 'Brackets estéticos',
  'Implante dental', 'Corona de porcelana', 'Prótesis removible',
  'Limpieza profunda', 'Férula de descarga', 'Carillas dentales'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  return `55${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

function generateEmail(name: string, lastName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  return `${name.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${randomElement(domains)}`;
}

interface DemoPatientGeneratorProps {
  onComplete?: () => void;
}

export const DemoPatientGenerator = ({ onComplete }: DemoPatientGeneratorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [patientCount, setPatientCount] = useState(10);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeTreatments, setIncludeTreatments] = useState(true);
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedStats, setGeneratedStats] = useState<{
    patients: number;
    appointments: number;
    treatments: number;
    invoices: number;
  } | null>(null);

  const generatePatients = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedStats(null);

    const stats = { patients: 0, appointments: 0, treatments: 0, invoices: 0 };

    try {
      // Fetch locations for appointments
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true);
      
      const defaultLocation = locations?.[0] || { id: 'default', name: 'Clínica Principal' };

      for (let i = 0; i < patientCount; i++) {
        const firstName = randomElement(FIRST_NAMES);
        const lastName = `${randomElement(LAST_NAMES)} ${randomElement(LAST_NAMES)}`;
        const fullName = `${firstName} ${lastName}`;
        const email = generateEmail(firstName, randomElement(LAST_NAMES));
        const phone = generatePhone();
        const city = randomElement(CITIES);
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const birthDate = randomDate(new Date(1950, 0, 1), new Date(2005, 11, 31));

        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: crypto.randomUUID(),
            full_name: fullName,
            email: email,
            phone: phone,
            address: `${city}, México`,
            gender: gender,
            date_of_birth: birthDate.toISOString().split('T')[0],
            tags: ['demo', city.toLowerCase().replace(' ', '-')],
            notes: `Paciente demo generado automáticamente`
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          continue;
        }

        stats.patients++;

        // Generate appointments
        if (includeAppointments && profile) {
          const appointmentCount = Math.floor(Math.random() * 4) + 1;
          
          for (let j = 0; j < appointmentCount; j++) {
            const service = randomElement(SERVICES);
            const appointmentDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
            const hour = Math.floor(Math.random() * 8) + 9; // 9 AM - 5 PM
            const status = ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)] as any;

            await supabase.from('appointments').insert({
              patient_name: fullName,
              patient_email: email,
              patient_phone: phone,
              service_id: service.id,
              service_name: service.name,
              location_id: defaultLocation.id,
              location_name: defaultLocation.name,
              appointment_date: appointmentDate.toISOString().split('T')[0],
              appointment_time: `${hour.toString().padStart(2, '0')}:00`,
              status: status
            });

            stats.appointments++;
          }
        }

        // Generate treatments - use profile.user_id as patient_id for consistency
        if (includeTreatments && profile) {
          const treatmentCount = Math.floor(Math.random() * 3);
          
          for (let j = 0; j < treatmentCount; j++) {
            const treatmentName = randomElement(TREATMENT_NAMES);
            const cost = Math.floor(Math.random() * 15000) + 1000;
            const startDate = randomDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date());
            const status = ['active', 'completed', 'pending'][Math.floor(Math.random() * 3)];

            await supabase.from('treatments').insert({
              patient_id: profile.user_id, // Use user_id for consistency with profile lookups
              name: treatmentName,
              description: `${treatmentName} para ${fullName}`,
              cost: cost,
              status: status,
              start_date: startDate.toISOString().split('T')[0],
              diagnosis: 'Diagnóstico demo',
              treatment_plan: 'Plan de tratamiento demo'
            });

            stats.treatments++;
          }
        }

        // Generate invoices - use profile.user_id as patient_id for consistency
        if (includeInvoices && profile) {
          const invoiceCount = Math.floor(Math.random() * 2);
          
          for (let j = 0; j < invoiceCount; j++) {
            const subtotal = Math.floor(Math.random() * 10000) + 500;
            const tax = subtotal * 0.16;
            const total = subtotal + tax;
            const status = ['pending', 'paid', 'overdue'][Math.floor(Math.random() * 3)];

            await supabase.from('invoices').insert({
              invoice_number: `INV-DEMO-${Date.now()}-${j}`,
              patient_id: profile.user_id, // Use user_id for consistency with profile lookups
              patient_name: fullName,
              patient_email: email,
              subtotal: subtotal,
              tax_amount: tax,
              total: total,
              status: status,
              due_date: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            });

            stats.invoices++;
          }
        }

        setProgress(((i + 1) / patientCount) * 100);
      }

      setGeneratedStats(stats);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({
        title: "¡Pacientes generados!",
        description: `${stats.patients} pacientes, ${stats.appointments} citas, ${stats.treatments} tratamientos, ${stats.invoices} facturas`,
      });

      onComplete?.();
    } catch (error) {
      console.error('Error generating demo data:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar los datos demo",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Generador de Pacientes Demo
        </CardTitle>
        <CardDescription>
          Crea pacientes de prueba con citas, tratamientos y facturas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Patient Count Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Número de pacientes</Label>
            <Badge variant="secondary">{patientCount}</Badge>
          </div>
          <Slider
            value={[patientCount]}
            onValueChange={([v]) => setPatientCount(v)}
            min={1}
            max={50}
            step={1}
            disabled={isGenerating}
          />
        </div>

        <Separator />

        {/* Options */}
        <div className="space-y-4">
          <Label className="text-muted-foreground">Datos adicionales a generar:</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Citas (1-4 por paciente)</span>
            </div>
            <Switch
              checked={includeAppointments}
              onCheckedChange={setIncludeAppointments}
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-green-500" />
              <span className="text-sm">Tratamientos (0-2 por paciente)</span>
            </div>
            <Switch
              checked={includeTreatments}
              onCheckedChange={setIncludeTreatments}
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Facturas (0-1 por paciente)</span>
            </div>
            <Switch
              checked={includeInvoices}
              onCheckedChange={setIncludeInvoices}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generando datos...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {generatedStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2"
          >
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{generatedStats.patients}</p>
              <p className="text-xs text-muted-foreground">Pacientes</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{generatedStats.appointments}</p>
              <p className="text-xs text-muted-foreground">Citas</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <Stethoscope className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{generatedStats.treatments}</p>
              <p className="text-xs text-muted-foreground">Tratamientos</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-center">
              <FileText className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold">{generatedStats.invoices}</p>
              <p className="text-xs text-muted-foreground">Facturas</p>
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generatePatients}
          disabled={isGenerating}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Shuffle className="w-4 h-4" />
              Generar {patientCount} Pacientes Demo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DemoPatientGenerator;
