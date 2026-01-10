import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  BarChart3, 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Sparkles,
  Send,
  Download,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const predefinedQueries = [
  { id: "revenue", label: "Ingresos del mes", icon: DollarSign },
  { id: "appointments", label: "Resumen de citas", icon: Calendar },
  { id: "treatments", label: "Tratamientos activos", icon: FileText },
  { id: "patients", label: "Nuevos pacientes", icon: Users },
  { id: "performance", label: "Rendimiento del equipo", icon: TrendingUp },
  { id: "custom", label: "Consulta personalizada", icon: MessageSquare },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIReportsModule = () => {
  const { toast } = useToast();
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [customQuery, setCustomQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch clinic data for context
  const { data: clinicData } = useQuery({
    queryKey: ['clinic-data-for-reports'],
    queryFn: async () => {
      const [appointmentsRes, treatmentsRes, patientsRes] = await Promise.all([
        supabase.from('appointments').select('*'),
        supabase.from('treatments').select('*'),
        supabase.from('profiles').select('*')
      ]);
      
      return {
        appointments: appointmentsRes.data || [],
        treatments: treatmentsRes.data || [],
        patients: patientsRes.data || [],
        totalRevenue: (treatmentsRes.data || []).reduce((acc, t) => acc + (t.cost || 0), 0)
      };
    }
  });

  const generateContextPrompt = (queryType: string) => {
    const context = clinicData ? `
Datos actuales de la clínica:
- Total de citas: ${clinicData.appointments.length}
- Citas pendientes: ${clinicData.appointments.filter(a => a.status === 'pending').length}
- Citas completadas: ${clinicData.appointments.filter(a => a.status === 'completed').length}
- Tratamientos activos: ${clinicData.treatments.filter(t => t.status === 'in_progress').length}
- Pacientes registrados: ${clinicData.patients.length}
- Ingresos estimados: ${clinicData.treatments.reduce((acc, t) => acc + (t.total_cost || 0), 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
` : '';

    const queryPrompts: Record<string, string> = {
      revenue: `${context}\nGenera un reporte detallado de ingresos con análisis y tendencias.`,
      appointments: `${context}\nGenera un resumen ejecutivo de las citas, incluyendo estadísticas y recomendaciones.`,
      treatments: `${context}\nAnaliza los tratamientos activos y proporciona insights sobre el progreso.`,
      patients: `${context}\nGenera un análisis de los pacientes, nuevos registros y retención.`,
      performance: `${context}\nEvalúa el rendimiento del equipo basándote en los datos disponibles.`,
    };

    return queryPrompts[queryType] || context;
  };

  const handleQuerySubmit = async () => {
    const query = selectedQuery === "custom" ? customQuery : generateContextPrompt(selectedQuery);
    if (!query.trim()) return;

    const userMessage: Message = { 
      role: "user", 
      content: selectedQuery === "custom" ? customQuery : predefinedQueries.find(q => q.id === selectedQuery)?.label || query 
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('dental-ai-assistant', {
        body: {
          messages: [
            ...messages,
            { role: "user", content: query }
          ],
          context: "reports_analysis"
        }
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setCustomQuery("");
    }
  };

  const exportReport = () => {
    const reportContent = messages
      .map(m => `${m.role === 'user' ? 'Consulta' : 'Respuesta'}: ${m.content}`)
      .join('\n\n---\n\n');
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ia-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Reportes con IA
            </CardTitle>
            <CardDescription>
              Obtén insights y análisis de tu clínica con inteligencia artificial
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Query Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {predefinedQueries.map((query) => (
            <Button
              key={query.id}
              variant={selectedQuery === query.id ? "default" : "outline"}
              className="h-auto py-3 px-4 justify-start gap-2"
              onClick={() => setSelectedQuery(query.id)}
            >
              <query.icon className="w-4 h-4" />
              <span className="text-sm">{query.label}</span>
            </Button>
          ))}
        </div>

        {/* Custom Query Input */}
        <AnimatePresence>
          {selectedQuery === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Escribe tu consulta... Ej: '¿Cuántos pacientes nuevos tuvimos este mes?' o '¿Cuál es el tratamiento más solicitado?'"
                className="min-h-[100px]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          onClick={handleQuerySubmit}
          disabled={isLoading || !selectedQuery || (selectedQuery === "custom" && !customQuery.trim())}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando reporte...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Reporte
            </>
          )}
        </Button>

        {/* Messages / Results */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary/10 ml-8"
                      : "bg-secondary mr-8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {message.role === "user" ? "Tu consulta" : "Respuesta IA"}
                      </Badge>
                      <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4"
              >
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Analizando datos...</span>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Stats Preview */}
        {clinicData && messages.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{clinicData.appointments.length}</p>
              <p className="text-xs text-muted-foreground">Total Citas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{clinicData.treatments.filter(t => t.status === 'in_progress').length}</p>
              <p className="text-xs text-muted-foreground">Tratamientos Activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{clinicData.patients.length}</p>
              <p className="text-xs text-muted-foreground">Pacientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {clinicData.totalRevenue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">Ingresos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
