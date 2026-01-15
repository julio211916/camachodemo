import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Trash2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SiriOrb } from "@/components/ui/siri-orb";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DashboardAIAssistantProps {
  userRole: "admin" | "doctor" | "patient" | "staff";
  userName?: string;
}

const getRoleContext = (role: string) => {
  switch (role) {
    case "admin":
      return {
        title: "Asistente Administrativo",
        subtitle: "IA para gestión clínica",
        quickActions: [
          { label: "Reportes", message: "¿Cómo genero un reporte de ingresos?" },
          { label: "Personal", message: "¿Cómo gestiono el personal de la clínica?" },
          { label: "Citas", message: "¿Cómo veo todas las citas del día?" },
          { label: "Finanzas", message: "¿Cómo reviso el estado financiero?" },
        ],
      };
    case "doctor":
      return {
        title: "Asistente Clínico",
        subtitle: "IA para consultas médicas",
        quickActions: [
          { label: "Pacientes", message: "¿Cómo veo mi lista de pacientes?" },
          { label: "Odontograma", message: "¿Cómo uso el odontograma?" },
          { label: "Notas", message: "¿Cómo registro notas clínicas?" },
          { label: "Tratamientos", message: "¿Cómo creo un plan de tratamiento?" },
        ],
      };
    case "patient":
      return {
        title: "Tu Asistente Dental",
        subtitle: "Estoy aquí para ayudarte",
        quickActions: [
          { label: "Citas", message: "¿Cómo agendo una cita?" },
          { label: "Tratamientos", message: "¿Cuáles son mis tratamientos activos?" },
          { label: "Pagos", message: "¿Cómo veo mis pagos pendientes?" },
          { label: "Referidos", message: "¿Cómo funciona el programa de referidos?" },
        ],
      };
    default:
      return {
        title: "Asistente NovellDent",
        subtitle: "IA de ayuda",
        quickActions: [
          { label: "Ayuda", message: "¿Cómo puedo ayudarte?" },
        ],
      };
  }
};

const getAIResponse = (message: string, role: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (role === "admin") {
    if (lowerMessage.includes("reporte") || lowerMessage.includes("informe")) {
      return "Para generar reportes, ve a la sección 'Reportes' en el menú lateral. Puedes generar reportes de:\n\n• Ingresos por período\n• Citas completadas\n• Productividad por doctor\n• Inventario\n\nSelecciona el tipo de reporte y el rango de fechas.";
    }
    if (lowerMessage.includes("personal") || lowerMessage.includes("empleado")) {
      return "La gestión de personal está en 'Administración > Personal'. Desde ahí puedes:\n\n• Ver todo el personal\n• Agregar nuevos empleados\n• Asignar roles y sucursales\n• Gestionar horarios\n• Ver nómina";
    }
    if (lowerMessage.includes("cita")) {
      return "Ve a 'Agenda' para ver todas las citas. Puedes filtrar por:\n\n• Fecha\n• Sucursal\n• Doctor\n• Estado (pendiente, confirmada, etc.)";
    }
    if (lowerMessage.includes("finanza") || lowerMessage.includes("ingreso")) {
      return "El panel financiero muestra:\n\n• Ingresos del día/semana/mes\n• Gastos operativos\n• Cuentas por cobrar\n• Historial de transacciones\n\nAccede desde 'Finanzas' en el menú.";
    }
  }
  
  if (role === "doctor") {
    if (lowerMessage.includes("paciente")) {
      return "Tu lista de pacientes está en 'Mis Pacientes'. Ahí verás:\n\n• Pacientes asignados\n• Próximas citas\n• Historial de tratamientos\n\nHaz clic en un paciente para ver su ficha completa.";
    }
    if (lowerMessage.includes("odontograma")) {
      return "El odontograma interactivo te permite:\n\n• Registrar condiciones por diente\n• Marcar tratamientos realizados\n• Ver historial de cada pieza\n• Exportar el registro\n\nSelecciona un paciente y ve a 'Odontograma'.";
    }
    if (lowerMessage.includes("nota")) {
      return "Las notas clínicas se registran en la ficha del paciente:\n\n1. Selecciona el paciente\n2. Ve a 'Notas Clínicas'\n3. Escribe tu nota\n4. Guarda con fecha y hora automáticas";
    }
    if (lowerMessage.includes("tratamiento") || lowerMessage.includes("plan")) {
      return "Para crear un plan de tratamiento:\n\n1. Selecciona el paciente\n2. Ve a 'Plan de Tratamiento'\n3. Agrega los procedimientos\n4. Define costos y plazos\n5. Genera el presupuesto";
    }
  }
  
  if (role === "patient") {
    if (lowerMessage.includes("cita") || lowerMessage.includes("agenda")) {
      return "Para agendar una cita:\n\n1. Ve a 'Mis Citas'\n2. Haz clic en 'Nueva Cita'\n3. Selecciona servicio, fecha y hora\n4. Confirma tu cita\n\n¡Recibirás un recordatorio por correo!";
    }
    if (lowerMessage.includes("tratamiento")) {
      return "Tus tratamientos activos están en 'Tratamientos'. Ahí verás:\n\n• Estado de cada tratamiento\n• Próximas sesiones\n• Progreso general\n• Costo y pagos realizados";
    }
    if (lowerMessage.includes("pago")) {
      return "Para ver tus pagos:\n\n1. Ve a 'Facturas'\n2. Verás el historial de pagos\n3. Pagos pendientes\n4. Opciones de pago\n\nPuedes pagar en línea o en la clínica.";
    }
    if (lowerMessage.includes("referido")) {
      return "¡El programa de referidos te da descuentos!\n\n1. Ve a 'Referidos'\n2. Comparte tu código único\n3. Cuando alguien lo use, ambos reciben 5% de descuento\n4. Acumula referidos para más beneficios";
    }
  }
  
  return "Entiendo tu consulta. ¿Podrías ser más específico para darte una mejor respuesta? Estoy aquí para ayudarte con cualquier duda sobre el sistema.";
};

export const DashboardAIAssistant = ({ userRole, userName }: DashboardAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context = getRoleContext(userRole);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
      setInput("");
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);

      // Simulate AI response delay
      setTimeout(() => {
        const response = getAIResponse(userMessage, userRole);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsLoading(false);
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (message: string) => {
    setMessages(prev => [...prev, { role: "user", content: message }]);
    setIsLoading(true);
    setTimeout(() => {
      const response = getAIResponse(message, userRole);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 800);
  };

  const clearMessages = () => setMessages([]);

  return (
    <>
      {/* Floating Button with SiriOrb */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
            aria-label="Abrir asistente IA"
          >
            <SiriOrb size="64px" animationDuration={15} />
            <span className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] max-h-[85vh] bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col"
          >
            {/* Header with SiriOrb */}
            <div className="relative bg-gradient-to-r from-primary/90 to-primary p-4 flex items-center justify-between overflow-hidden">
              <div className="absolute -top-10 -left-10 opacity-30">
                <SiriOrb size="120px" animationDuration={25} />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{context.title}</h3>
                  <p className="text-xs text-white/80">{context.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                  title="Limpiar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 mx-auto mb-3 relative flex items-center justify-center">
                      <SiriOrb size="80px" animationDuration={20} />
                      <Sparkles className="w-6 h-6 text-primary absolute" />
                    </div>
                    <h4 className="font-semibold text-foreground">
                      ¡Hola{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Soy tu asistente IA. ¿En qué puedo ayudarte?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {context.quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.message)}
                        className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors text-left"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          msg.role === "user" ? "bg-primary/10" : "bg-secondary"
                        )}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary/50 text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 rounded-full bg-secondary/30 border-0 focus-visible:ring-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
