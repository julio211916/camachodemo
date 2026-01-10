import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Newspaper, 
  Send, 
  Calendar,
  Users,
  Eye,
  Clock,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Sparkles,
  FileText,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Newsletter {
  id: string;
  title: string;
  content: string;
  status: "draft" | "scheduled" | "sent";
  scheduled_for?: string;
  sent_at?: string;
  recipients_count?: number;
  created_at: string;
}

export const NewsletterModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Fetch newsletters (using scheduled_emails table for demo)
  const { data: newsletters = [], isLoading } = useQuery({
    queryKey: ['newsletters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(email => ({
        id: email.id,
        title: email.name,
        content: email.html_content,
        status: email.status as "draft" | "scheduled" | "sent",
        scheduled_for: email.scheduled_at,
        sent_at: email.sent_at,
        recipients_count: email.target_emails?.length || 0,
        created_at: email.created_at
      }));
    }
  });

  // Fetch patients count for targeting
  const { data: patientsCount = 0 } = useQuery({
    queryKey: ['patients-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const templates = [
    { id: "tips", name: "Tips de Salud Dental", icon: "🦷" },
    { id: "promo", name: "Promociones del Mes", icon: "🎉" },
    { id: "news", name: "Noticias de la Clínica", icon: "📰" },
    { id: "seasonal", name: "Contenido de Temporada", icon: "🌟" },
    { id: "reminder", name: "Recordatorio de Citas", icon: "📅" }
  ];

  const generateWithAI = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Selecciona una plantilla",
        description: "Elige un tipo de newsletter para generar contenido.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('dental-ai-assistant', {
        body: {
          messages: [{
            role: "user",
            content: `Genera un newsletter profesional para una clínica dental con el tema: ${selectedTemplate}. 
            Incluye:
            1. Un título atractivo
            2. Un saludo personalizado
            3. 2-3 párrafos de contenido relevante
            4. Tips o recomendaciones
            5. Una llamada a la acción
            
            Responde en HTML simple y atractivo.`
          }],
          context: "newsletter_generation"
        }
      });

      if (response.error) throw response.error;

      setContent(response.data.response);
      setTitle(`Newsletter - ${templates.find(t => t.id === selectedTemplate)?.name || 'Actualización'}`);

      toast({
        title: "Contenido generado",
        description: "El newsletter ha sido generado con IA. Revisa y edita según sea necesario."
      });
    } catch (error) {
      console.error('Newsletter generation error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el contenido. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveNewsletter = async (status: "draft" | "scheduled") => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el título y contenido.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.from('scheduled_emails').insert({
        name: title,
        subject: title,
        html_content: content,
        status: status,
        scheduled_at: status === "scheduled" ? scheduledDate || new Date().toISOString() : new Date().toISOString(),
        target_emails: []
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      
      toast({
        title: status === "draft" ? "Borrador guardado" : "Newsletter programado",
        description: status === "draft" 
          ? "El newsletter se ha guardado como borrador."
          : `Se enviará a ${patientsCount} pacientes.`
      });

      // Reset form
      setTitle("");
      setContent("");
      setScheduledDate("");
      setSelectedTemplate("");
      setActiveTab("history");
    } catch (error) {
      console.error('Save newsletter error:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el newsletter.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Borrador</Badge>;
      case "scheduled": return <Badge className="bg-blue-100 text-blue-700">Programado</Badge>;
      case "sent": return <Badge className="bg-green-100 text-green-700">Enviado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patientsCount}</p>
                <p className="text-xs text-muted-foreground">Suscriptores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {newsletters.filter(n => n.status === 'sent').length}
                </p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {newsletters.filter(n => n.status === 'scheduled').length}
                </p>
                <p className="text-xs text-muted-foreground">Programados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {newsletters.filter(n => n.status === 'draft').length}
                </p>
                <p className="text-xs text-muted-foreground">Borradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Newsletter Mensual
          </CardTitle>
          <CardDescription>
            Crea y envía boletines informativos a tus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Newsletter
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="w-4 h-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-3">
                <Label>Selecciona una plantilla</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <span className="text-2xl">{template.icon}</span>
                      <span className="text-xs text-center">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* AI Generate Button */}
              <Button
                variant="outline"
                onClick={generateWithAI}
                disabled={isGenerating || !selectedTemplate}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando contenido...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar con IA
                  </>
                )}
              </Button>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Newsletter</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Tips de Salud Dental - Enero 2026"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe el contenido del newsletter..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Programar envío (opcional)</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => saveNewsletter("draft")}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Guardar Borrador
                  </Button>
                  <Button
                    onClick={() => saveNewsletter("scheduled")}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {scheduledDate ? "Programar Envío" : "Enviar Ahora"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : newsletters.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No hay newsletters creados</p>
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab("create")}
                    >
                      Crear el primero
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {newsletters.map((newsletter) => (
                        <motion.div
                          key={newsletter.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{newsletter.title}</h4>
                                {getStatusBadge(newsletter.status)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {newsletter.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {newsletter.recipients_count || 0} destinatarios
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(newsletter.created_at), "d MMM yyyy", { locale: es })}
                                </span>
                                {newsletter.scheduled_for && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(newsletter.scheduled_for), "d MMM, HH:mm", { locale: es })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
