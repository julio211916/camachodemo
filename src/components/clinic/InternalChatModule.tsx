import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Send, 
  Search,
  Users,
  Circle,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  unreadCount: number;
}

// Mock data for demonstration
const mockTeamMembers: TeamMember[] = [
  { id: "1", name: "Dr. García", role: "Odontólogo", status: "online", unreadCount: 2 },
  { id: "2", name: "Dra. López", role: "Ortodoncista", status: "online", unreadCount: 0 },
  { id: "3", name: "María Sánchez", role: "Asistente", status: "away", unreadCount: 5 },
  { id: "4", name: "Carlos Rodríguez", role: "Recepcionista", status: "offline", unreadCount: 0 },
  { id: "5", name: "Ana Martínez", role: "Higienista", status: "online", unreadCount: 1 }
];

const mockMessages: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", senderId: "1", senderName: "Dr. García", content: "Hola, ¿tienes los resultados del paciente Pérez?", timestamp: new Date(Date.now() - 3600000), read: true },
    { id: "2", senderId: "me", senderName: "Yo", content: "Sí, los rayos X están listos. Te los envío ahora.", timestamp: new Date(Date.now() - 3000000), read: true },
    { id: "3", senderId: "1", senderName: "Dr. García", content: "Perfecto, gracias. También necesito programar una consulta de seguimiento.", timestamp: new Date(Date.now() - 1800000), read: false }
  ],
  "3": [
    { id: "1", senderId: "3", senderName: "María Sánchez", content: "¿Puedes revisar el inventario de guantes?", timestamp: new Date(Date.now() - 7200000), read: true },
    { id: "2", senderId: "3", senderName: "María Sánchez", content: "Creo que necesitamos hacer un pedido", timestamp: new Date(Date.now() - 7000000), read: true }
  ]
};

export const InternalChatModule = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredMembers = mockTeamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedMember) {
      setMessages(mockMessages[selectedMember.id] || []);
    }
  }, [selectedMember]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedMember) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: profile?.full_name || "Yo",
      content: newMessage,
      timestamp: new Date(),
      read: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate response
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedMember.id,
        senderName: selectedMember.name,
        content: "Recibido, te respondo en un momento.",
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Team Members List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Equipo
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <div className="space-y-1 p-2">
              {filteredMembers.map((member) => (
                <motion.button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    selectedMember?.id === member.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(member.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      {member.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                          {member.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2 flex flex-col">
        {selectedMember ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{selectedMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(selectedMember.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedMember.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Circle className={`w-2 h-2 ${selectedMember.status === 'online' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                      {selectedMember.status === 'online' ? 'En línea' : selectedMember.status === 'away' ? 'Ausente' : 'Desconectado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[380px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.senderId === 'me' ? 'order-2' : ''}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              message.senderId === 'me'
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-secondary rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${message.senderId === 'me' ? 'text-right' : ''}`}>
                            {format(message.timestamp, "HH:mm", { locale: es })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Selecciona un miembro del equipo para chatear</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
