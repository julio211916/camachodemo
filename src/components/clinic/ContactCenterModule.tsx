import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Clock,
  User,
  Send,
  PhoneCall,
  PhoneOff,
  Bot,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Communication {
  id: string;
  type: "call" | "whatsapp" | "email";
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: Date;
  status: "pending" | "answered" | "missed" | "completed";
  isAIHandled: boolean;
}

// Mock data for demonstration
const mockCommunications: Communication[] = [
  {
    id: "1",
    type: "whatsapp",
    patientName: "María García",
    patientPhone: "+52 55 1234 5678",
    message: "Hola, quisiera agendar una cita para limpieza dental",
    timestamp: new Date(),
    status: "pending",
    isAIHandled: true
  },
  {
    id: "2",
    type: "call",
    patientName: "Juan Pérez",
    patientPhone: "+52 55 9876 5432",
    message: "Llamada sobre cita de mañana",
    timestamp: new Date(Date.now() - 3600000),
    status: "answered",
    isAIHandled: false
  },
  {
    id: "3",
    type: "email",
    patientName: "Ana López",
    patientPhone: "ana.lopez@email.com",
    message: "Solicitud de presupuesto para ortodoncia",
    timestamp: new Date(Date.now() - 7200000),
    status: "completed",
    isAIHandled: true
  }
];

export const ContactCenterModule = () => {
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>(mockCommunications);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [aiEnabled, setAiEnabled] = useState(true);

  const filteredComms = communications.filter(comm => {
    if (filter === "all") return true;
    if (filter === "pending") return comm.status === "pending" || comm.status === "missed";
    return comm.status === "completed" || comm.status === "answered";
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-4 h-4" />;
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call": return "bg-blue-500";
      case "whatsapp": return "bg-green-500";
      case "email": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pendiente</Badge>;
      case "answered": return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Respondido</Badge>;
      case "missed": return <Badge variant="destructive">Perdida</Badge>;
      case "completed": return <Badge variant="secondary" className="bg-green-100 text-green-700">Completado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleReply = () => {
    if (!replyMessage.trim() || !selectedComm) return;

    setCommunications(prev => prev.map(c => 
      c.id === selectedComm.id ? { ...c, status: "completed" as const } : c
    ));

    toast({
      title: "Mensaje enviado",
      description: `Respuesta enviada a ${selectedComm.patientName}`
    });

    setReplyMessage("");
    setSelectedComm(null);
  };

  const stats = {
    total: communications.length,
    pending: communications.filter(c => c.status === "pending").length,
    aiHandled: communications.filter(c => c.isAIHandled).length,
    calls: communications.filter(c => c.type === "call").length,
    whatsapp: communications.filter(c => c.type === "whatsapp").length,
    email: communications.filter(c => c.type === "email").length
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Communications List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Center
              </CardTitle>
              <CardDescription>
                Gestiona llamadas, WhatsApp y emails desde un solo lugar
              </CardDescription>
            </div>
            <Button
              variant={aiEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              {aiEnabled ? "IA Activa" : "IA Inactiva"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-primary">{stats.aiHandled}</p>
              <p className="text-xs text-muted-foreground">IA</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{stats.calls}</p>
              <p className="text-xs text-muted-foreground">Llamadas</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-600">{stats.whatsapp}</p>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{stats.email}</p>
              <p className="text-xs text-muted-foreground">Emails</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="completed">Completados</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Communications List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              <AnimatePresence>
                {filteredComms.map((comm) => (
                  <motion.div
                    key={comm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => setSelectedComm(comm)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedComm?.id === comm.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full ${getTypeColor(comm.type)} flex items-center justify-center text-white`}>
                        {getTypeIcon(comm.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">{comm.patientName}</h4>
                          <div className="flex items-center gap-2">
                            {comm.isAIHandled && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Bot className="w-3 h-3" />
                                IA
                              </Badge>
                            )}
                            {getStatusBadge(comm.status)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{comm.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{comm.patientPhone}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(comm.timestamp, "HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Panel - Details & Reply */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedComm ? "Detalles" : "Selecciona una conversación"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedComm ? (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedComm.patientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedComm.patientName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedComm.patientPhone}</p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedComm.type)}
                  <span className="text-sm font-medium capitalize">{selectedComm.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(selectedComm.timestamp, "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-sm">{selectedComm.message}</p>
              </div>

              {/* AI Suggestion */}
              {aiEnabled && selectedComm.status === "pending" && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Sugerencia IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Hola {selectedComm.patientName.split(' ')[0]}, gracias por contactarnos. 
                    Tenemos disponibilidad esta semana. ¿Le gustaría agendar su cita para el 
                    miércoles a las 10:00 AM o el jueves a las 3:00 PM?"
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Usar sugerencia
                  </Button>
                </div>
              )}

              {/* Reply Form */}
              {selectedComm.status !== "completed" && (
                <div className="space-y-3">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleReply} className="flex-1">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                    {selectedComm.type === "call" && (
                      <Button variant="outline" size="icon">
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm">Agendar Cita</Button>
                <Button variant="outline" size="sm">Ver Historial</Button>
                <Button variant="outline" size="sm">Enviar Recordatorio</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Selecciona una comunicación para ver los detalles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
