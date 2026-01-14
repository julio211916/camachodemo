import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Mic, MicOff, Send, Loader2, Sparkles, X, MessageSquare,
  BarChart3, Users, Calendar, DollarSign, FileText, Settings,
  ChevronDown, Volume2, VolumeX, Lightbulb, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

interface QuickCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  command: string;
  category: string;
}

interface AIDashboardAssistantProps {
  onNavigate?: (section: string) => void;
}

export const AIDashboardAssistant = ({ onNavigate }: AIDashboardAssistantProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch dashboard data for AI context
  const { data: stats } = useQuery({
    queryKey: ['ai-dashboard-stats'],
    queryFn: async () => {
      const [patients, appointments, invoices, treatments] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id, status, appointment_date').order('appointment_date', { ascending: false }).limit(100),
        supabase.from('invoices').select('id, total, status'),
        supabase.from('treatments').select('id, status, cost')
      ]);

      const todayAppointments = appointments.data?.filter(a => 
        new Date(a.appointment_date).toDateString() === new Date().toDateString()
      ).length || 0;

      const pendingPayments = invoices.data?.filter(i => i.status === 'pending').length || 0;
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || 0), 0) || 0;
      const activePatients = patients.count || 0;

      return {
        activePatients,
        todayAppointments,
        pendingPayments,
        totalRevenue,
        recentAppointments: appointments.data?.slice(0, 5) || [],
        activeTreatments: treatments.data?.filter(t => t.status === 'active').length || 0
      };
    }
  });

  const quickCommands: QuickCommand[] = [
    { id: '1', label: 'Citas de hoy', icon: <Calendar className="w-4 h-4" />, command: '¿Cuántas citas tengo hoy?', category: 'Agenda' },
    { id: '2', label: 'Resumen pacientes', icon: <Users className="w-4 h-4" />, command: 'Dame un resumen de pacientes', category: 'Pacientes' },
    { id: '3', label: 'Ingresos del mes', icon: <DollarSign className="w-4 h-4" />, command: '¿Cuáles son los ingresos del mes?', category: 'Finanzas' },
    { id: '4', label: 'Pagos pendientes', icon: <FileText className="w-4 h-4" />, command: '¿Cuántos pagos están pendientes?', category: 'Finanzas' },
    { id: '5', label: 'Ir a Agenda', icon: <Calendar className="w-4 h-4" />, command: 'Llévame a la agenda', category: 'Navegación' },
    { id: '6', label: 'Tendencias', icon: <TrendingUp className="w-4 h-4" />, command: 'Muéstrame las tendencias de la clínica', category: 'Análisis' },
  ];

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({ 
        title: "No disponible", 
        description: "Tu navegador no soporta reconocimiento de voz",
        variant: "destructive" 
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1;
      utterance.onend = () => setIsSpeaking(false);
      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const processCommand = useCallback((command: string): string => {
    const lowerCommand = command.toLowerCase();
    
    // Navigation commands
    if (lowerCommand.includes('agenda') || lowerCommand.includes('citas')) {
      if (lowerCommand.includes('ir') || lowerCommand.includes('llévame') || lowerCommand.includes('navega')) {
        onNavigate?.('appointments');
        return '📅 Navegando a la Agenda...';
      }
    }

    if (lowerCommand.includes('pacientes')) {
      if (lowerCommand.includes('ir') || lowerCommand.includes('llévame') || lowerCommand.includes('navega')) {
        onNavigate?.('patients');
        return '👥 Navegando a Pacientes...';
      }
      return `📊 **Resumen de Pacientes**\n\n- Total de pacientes activos: **${stats?.activePatients || 0}**\n- Tratamientos activos: **${stats?.activeTreatments || 0}**\n\n¿Necesitas más detalles?`;
    }

    if (lowerCommand.includes('facturas') || lowerCommand.includes('facturación')) {
      onNavigate?.('billing');
      return '💰 Navegando a Facturación...';
    }

    // Data queries
    if (lowerCommand.includes('citas') && lowerCommand.includes('hoy')) {
      return `📅 **Citas de Hoy**\n\nTienes **${stats?.todayAppointments || 0}** citas programadas para hoy.\n\n¿Quieres ver el detalle de las citas?`;
    }

    if (lowerCommand.includes('pagos') && lowerCommand.includes('pendientes')) {
      return `💳 **Pagos Pendientes**\n\nHay **${stats?.pendingPayments || 0}** pagos pendientes por cobrar.\n\nPuedo ayudarte a gestionar los cobros si lo necesitas.`;
    }

    if (lowerCommand.includes('ingresos') || lowerCommand.includes('ganancias')) {
      const revenue = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(stats?.totalRevenue || 0);
      return `💰 **Ingresos**\n\nIngresos totales cobrados: **${revenue}**\n\n¿Deseas ver un desglose más detallado?`;
    }

    if (lowerCommand.includes('tendencias') || lowerCommand.includes('análisis')) {
      return `📈 **Tendencias de la Clínica**\n\n- Pacientes registrados: **${stats?.activePatients || 0}**\n- Citas hoy: **${stats?.todayAppointments || 0}**\n- Tratamientos activos: **${stats?.activeTreatments || 0}**\n- Pagos pendientes: **${stats?.pendingPayments || 0}**\n\nEstamos en buen camino. ¿Quieres profundizar en algún área?`;
    }

    if (lowerCommand.includes('ayuda') || lowerCommand.includes('qué puedes hacer')) {
      return `🤖 **Soy tu Asistente de Dashboard**\n\nPuedo ayudarte con:\n\n📅 **Agenda** - Ver citas del día, programar recordatorios\n👥 **Pacientes** - Buscar y ver resúmenes\n💰 **Finanzas** - Ingresos, pagos pendientes\n🧭 **Navegación** - Ir a cualquier sección\n📊 **Análisis** - Tendencias y estadísticas\n\n¡Solo pregúntame!`;
    }

    // Default response
    return `🤔 Entendí: "${command}"\n\nAquí tienes un resumen rápido:\n- Pacientes: ${stats?.activePatients || 0}\n- Citas hoy: ${stats?.todayAppointments || 0}\n- Pagos pendientes: ${stats?.pendingPayments || 0}\n\n¿En qué más puedo ayudarte?`;
  }, [stats, onNavigate]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate processing
    await new Promise(r => setTimeout(r, 500));

    const response = processCommand(text);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    // Speak response if speech is enabled
    if (messageText && recognitionRef.current) {
      speakMessage(response.replace(/\*\*/g, '').replace(/📅|👥|💰|🤖|📊|💳|📈|🤔|🧭/g, ''));
    }
  };

  const handleQuickCommand = (command: QuickCommand) => {
    handleSendMessage(command.command);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Asistente IA</CardTitle>
              <p className="text-xs text-muted-foreground">Dashboard & Navegación por Voz</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSpeaking ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={stopSpeaking}>
                <VolumeX className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => messages.length > 0 && speakMessage(messages[messages.length - 1].content)}>
                <Volume2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Quick Commands */}
              {messages.length === 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Comandos rápidos:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickCommands.slice(0, 4).map((cmd) => (
                      <Button
                        key={cmd.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => handleQuickCommand(cmd)}
                      >
                        {cmd.icon}
                        {cmd.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">¡Hola! Pregúntame algo o usa los comandos de voz</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary rounded-lg px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Button
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    className={`shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                    onClick={toggleListening}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Escuchando..." : "Escribe o usa la voz..."}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isListening}
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AIDashboardAssistant;
