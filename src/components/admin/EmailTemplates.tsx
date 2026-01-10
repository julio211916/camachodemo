import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Gift,
  PartyPopper,
  Bell,
  Heart,
  Star,
  Calendar,
  Send,
  Loader2,
  Eye,
  Edit,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  icon: React.ReactNode;
  category: "referral" | "reminder" | "celebration" | "loyalty";
  color: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "welcome-referral",
    name: "Bienvenida al Programa",
    subject: "🎁 ¡Bienvenido al programa de referidos de NovellDent!",
    message: "Nos alegra que quieras ser parte de nuestro programa de referidos. Ahora puedes compartir tu código único con amigos y familiares para que ambos disfruten de descuentos exclusivos en sus tratamientos dentales.",
    icon: <Gift className="w-5 h-5" />,
    category: "referral",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    id: "referral-reminder",
    name: "Recordatorio de Código",
    subject: "🔔 ¡No olvides compartir tu código de referido!",
    message: "¿Sabías que tienes un código de referido esperando ser compartido? Por cada amigo que refieras y complete su cita, recibirás un 5% de descuento. ¡No dejes pasar esta oportunidad de ahorrar!",
    icon: <Bell className="w-5 h-5" />,
    category: "reminder",
    color: "from-yellow-500/20 to-yellow-600/10",
  },
  {
    id: "referral-success",
    name: "Felicitaciones por Referido",
    subject: "🎉 ¡Felicidades! Tu referido completó su cita",
    message: "¡Excelentes noticias! Uno de tus referidos acaba de completar su primera cita en NovellDent. Has ganado un 5% de descuento que se aplicará automáticamente en tu próximo tratamiento. ¡Gracias por confiar en nosotros!",
    icon: <PartyPopper className="w-5 h-5" />,
    category: "celebration",
    color: "from-green-500/20 to-green-600/10",
  },
  {
    id: "discount-applied",
    name: "Descuento Aplicado",
    subject: "✨ Tu descuento ha sido aplicado",
    message: "Tu descuento por referido ha sido aplicado exitosamente a tu cuenta. Podrás disfrutarlo en tu próxima visita. ¡Sigue refiriendo amigos y acumula más beneficios!",
    icon: <Sparkles className="w-5 h-5" />,
    category: "celebration",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    id: "loyalty-thanks",
    name: "Agradecimiento de Lealtad",
    subject: "❤️ Gracias por ser parte de la familia NovellDent",
    message: "Queremos agradecerte por tu lealtad y confianza. Como paciente especial, te recordamos que tienes acceso exclusivo a nuestro programa de referidos con descuentos del 5% por cada amigo que nos recomiendes.",
    icon: <Heart className="w-5 h-5" />,
    category: "loyalty",
    color: "from-red-500/20 to-red-600/10",
  },
  {
    id: "milestone-5",
    name: "Logro: 5 Referidos",
    subject: "🌟 ¡Increíble! Has alcanzado 5 referidos",
    message: "¡Eres un embajador estrella de NovellDent! Has logrado referir a 5 personas y acumulado beneficios increíbles. Como agradecimiento especial, te otorgamos un bono adicional del 10% en tu próximo tratamiento.",
    icon: <Star className="w-5 h-5" />,
    category: "celebration",
    color: "from-amber-500/20 to-amber-600/10",
  },
  {
    id: "appointment-reminder",
    name: "Recordatorio de Cita",
    subject: "📅 Tu cita en NovellDent está próxima",
    message: "Te recordamos que tienes una cita programada con nosotros. No olvides que si traes a un amigo con tu código de referido, ambos recibirán beneficios especiales.",
    icon: <Calendar className="w-5 h-5" />,
    category: "reminder",
    color: "from-indigo-500/20 to-indigo-600/10",
  },
  {
    id: "reactivation",
    name: "Reactivación de Paciente",
    subject: "😊 ¡Te extrañamos en NovellDent!",
    message: "Ha pasado tiempo desde tu última visita y queríamos recordarte lo importante que es tu salud dental. Vuelve a vernos y aprovecha tu código de referido para obtener descuentos especiales para ti y tus amigos.",
    icon: <Users className="w-5 h-5" />,
    category: "loyalty",
    color: "from-teal-500/20 to-teal-600/10",
  },
];

const categoryLabels = {
  referral: { label: "Referidos", color: "bg-blue-500/20 text-blue-600" },
  reminder: { label: "Recordatorio", color: "bg-yellow-500/20 text-yellow-600" },
  celebration: { label: "Celebración", color: "bg-green-500/20 text-green-600" },
  loyalty: { label: "Lealtad", color: "bg-red-500/20 text-red-600" },
};

interface EmailTemplatesProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  showSendButton?: boolean;
}

export const EmailTemplates = ({ onSelectTemplate, showSendButton = true }: EmailTemplatesProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [targetEmails, setTargetEmails] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTemplates = defaultTemplates.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  );

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomSubject(template.subject);
    setCustomMessage(template.message);
    
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const sendEmail = async () => {
    if (!selectedTemplate) return;

    setIsSending(true);
    try {
      const emails = targetEmails.trim()
        ? targetEmails.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined;

      const { data, error } = await supabase.functions.invoke("send-referral-promo", {
        body: {
          targetEmails: emails,
          subject: customSubject,
          customMessage: customMessage,
        },
      });

      if (error) throw error;

      toast({
        title: "Emails enviados",
        description: `Se enviaron ${data.sent} de ${data.total} emails correctamente`,
      });

      setShowSendDialog(false);
      setTargetEmails("");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: "No se pudieron enviar los emails",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Plantillas de Email
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona una plantilla predefinida para enviar a tus pacientes
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="referral">Referidos</SelectItem>
            <SelectItem value="reminder">Recordatorios</SelectItem>
            <SelectItem value="celebration">Celebraciones</SelectItem>
            <SelectItem value="loyalty">Lealtad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                  selectedTemplate?.id === template.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}
                  >
                    {template.icon}
                  </div>
                  <h4 className="font-medium mb-1">{template.name}</h4>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${categoryLabels[template.category].color}`}
                  >
                    {categoryLabels[template.category].label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {template.message}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    {showSendButton && (
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template);
                          setShowSendDialog(true);
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center`}
                  >
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <p className="font-medium">{selectedTemplate.name}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${categoryLabels[selectedTemplate.category].color}`}
                    >
                      {categoryLabels[selectedTemplate.category].label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Asunto</p>
                    <p className="text-sm font-medium">{selectedTemplate.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mensaje</p>
                    <p className="text-sm">{selectedTemplate.message}</p>
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 text-sm font-medium">
                  Vista previa del email
                </div>
                <div className="p-6 bg-white">
                  <div className="text-center mb-6">
                    <span className="text-2xl">🦷</span>
                    <h2 className="text-xl font-bold text-[#1e3a5f]">NovellDent</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">🎁</div>
                    <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3">
                      ¡Hola [Nombre del Paciente]!
                    </h3>
                    <p className="text-gray-600 text-sm">{selectedTemplate.message}</p>
                    <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                      Obtener mi código de referido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {showSendButton && (
              <Button
                onClick={() => {
                  setShowPreview(false);
                  setShowSendDialog(true);
                }}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Usar esta plantilla
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Personaliza y envía este email a tus pacientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destinatarios</label>
              <Input
                value={targetEmails}
                onChange={(e) => setTargetEmails(e.target.value)}
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para enviar a todos los pacientes
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Asunto</label>
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                El email incluirá automáticamente el diseño profesional de NovellDent
                con información del programa de referidos.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={sendEmail} disabled={isSending} className="gap-2">
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Emails
            </Button>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
