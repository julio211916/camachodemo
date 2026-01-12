import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  MessageSquare,
  FileText,
  Settings,
  Maximize2,
  Volume2,
  VolumeX,
  ScreenShare,
  ScreenShareOff
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VideoSession {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  roomId: string;
  notes?: string;
}

interface TelemedicineModuleProps {
  userRole?: 'admin' | 'doctor';
}

export const TelemedicineModule = ({ userRole = 'doctor' }: TelemedicineModuleProps) => {
  const [sessions, setSessions] = useState<VideoSession[]>([
    {
      id: '1',
      patientName: 'María García',
      patientEmail: 'maria@email.com',
      doctorName: 'Dr. Carlos Rodríguez',
      scheduledAt: new Date().toISOString(),
      duration: 30,
      status: 'scheduled',
      roomId: 'room-001',
      notes: 'Consulta de seguimiento ortodoncia'
    },
    {
      id: '2',
      patientName: 'Juan López',
      patientEmail: 'juan@email.com',
      doctorName: 'Dra. Ana Martínez',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      duration: 45,
      status: 'scheduled',
      roomId: 'room-002',
      notes: 'Evaluación inicial'
    },
    {
      id: '3',
      patientName: 'Laura Sánchez',
      patientEmail: 'laura@email.com',
      doctorName: 'Dr. Carlos Rodríguez',
      scheduledAt: new Date(Date.now() - 86400000).toISOString(),
      duration: 30,
      status: 'completed',
      roomId: 'room-003',
      notes: 'Revisión de tratamiento'
    }
  ]);

  const [activeCall, setActiveCall] = useState<VideoSession | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessages, setChatMessages] = useState<{sender: string; message: string; time: string}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    patientName: '',
    patientEmail: '',
    doctorName: '',
    date: '',
    time: '',
    duration: '30',
    notes: ''
  });

  const filteredSessions = sessions.filter(session =>
    session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scheduledSessions = filteredSessions.filter(s => s.status === 'scheduled');
  const completedSessions = filteredSessions.filter(s => s.status === 'completed');

  const startCall = (session: VideoSession) => {
    setActiveCall(session);
    setSessions(prev => prev.map(s => 
      s.id === session.id ? { ...s, status: 'in-progress' as const } : s
    ));
    toast.success(`Videollamada iniciada con ${session.patientName}`);
  };

  const endCall = () => {
    if (activeCall) {
      setSessions(prev => prev.map(s => 
        s.id === activeCall.id ? { ...s, status: 'completed' as const } : s
      ));
      toast.info('Videollamada finalizada');
    }
    setActiveCall(null);
    setIsVideoOn(true);
    setIsMicOn(true);
    setIsScreenSharing(false);
    setChatMessages([]);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, {
        sender: 'Tú',
        message: newMessage,
        time: format(new Date(), 'HH:mm')
      }]);
      setNewMessage('');
      // Simular respuesta
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          sender: activeCall?.patientName || 'Paciente',
          message: 'Gracias doctor, entendido.',
          time: format(new Date(), 'HH:mm')
        }]);
      }, 2000);
    }
  };

  const createSession = () => {
    if (!newSession.patientName || !newSession.date || !newSession.time) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    const session: VideoSession = {
      id: Date.now().toString(),
      patientName: newSession.patientName,
      patientEmail: newSession.patientEmail,
      doctorName: newSession.doctorName || 'Dr. Asignado',
      scheduledAt: new Date(`${newSession.date}T${newSession.time}`).toISOString(),
      duration: parseInt(newSession.duration),
      status: 'scheduled',
      roomId: `room-${Date.now()}`,
      notes: newSession.notes
    };

    setSessions(prev => [...prev, session]);
    setNewSession({
      patientName: '',
      patientEmail: '',
      doctorName: '',
      date: '',
      time: '',
      duration: '30',
      notes: ''
    });
    setShowNewSessionDialog(false);
    toast.success('Consulta de telemedicina programada');
  };

  const getStatusBadge = (status: VideoSession['status']) => {
    const variants = {
      'scheduled': { variant: 'outline' as const, label: 'Programada', className: 'border-blue-500 text-blue-500' },
      'in-progress': { variant: 'default' as const, label: 'En curso', className: 'bg-green-500' },
      'completed': { variant: 'secondary' as const, label: 'Completada', className: '' },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelada', className: '' }
    };
    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  // Vista de videollamada activa
  if (activeCall) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        {/* Header de la llamada */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-medium">{activeCall.patientName}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                En llamada...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Conectado
            </Badge>
          </div>
        </div>

        {/* Área de video */}
        <div className="flex-1 relative bg-gray-950 flex items-center justify-center">
          {/* Video principal (paciente) */}
          <div className="w-full h-full flex items-center justify-center">
            {isVideoOn ? (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-16 w-16 text-primary/50" />
                </div>
                <p className="text-gray-400">Video del paciente</p>
                <p className="text-gray-500 text-sm">{activeCall.patientName}</p>
              </div>
            ) : (
              <div className="text-center">
                <VideoOff className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Video desactivado</p>
              </div>
            )}
          </div>

          {/* Video pequeño (doctor) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            {isVideoOn ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <p className="text-gray-400 text-xs mt-2">Tú</p>
              </div>
            ) : (
              <VideoOff className="h-8 w-8 text-gray-600" />
            )}
          </div>

          {/* Botón de pantalla completa */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat lateral */}
        <div className="absolute right-0 top-16 bottom-24 w-80 bg-gray-800 border-l border-gray-700 flex flex-col hidden lg:flex">
          <div className="p-3 border-b border-gray-700">
            <h4 className="text-white font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat de la consulta
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'Tú' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-2 ${
                  msg.sender === 'Tú' ? 'bg-primary text-primary-foreground' : 'bg-gray-700 text-white'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">{msg.sender} • {msg.time}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Controles de la llamada */}
        <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
          <Button
            variant={isMicOn ? 'outline' : 'destructive'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOn ? 'outline' : 'destructive'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isSpeakerOn ? 'outline' : 'destructive'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              toast.info(isScreenSharing ? 'Pantalla compartida desactivada' : 'Compartiendo pantalla...');
            }}
          >
            {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={endCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12"
          >
            <FileText className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Telemedicina
          </h2>
          <p className="text-muted-foreground">Gestión de consultas por videollamada</p>
        </div>
        <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Programar Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Consulta de Telemedicina</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre del Paciente *</label>
                <Input
                  value={newSession.patientName}
                  onChange={(e) => setNewSession(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email del Paciente</label>
                <Input
                  type="email"
                  value={newSession.patientEmail}
                  onChange={(e) => setNewSession(prev => ({ ...prev, patientEmail: e.target.value }))}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Doctor Asignado</label>
                <Select
                  value={newSession.doctorName}
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, doctorName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Carlos Rodríguez">Dr. Carlos Rodríguez</SelectItem>
                    <SelectItem value="Dra. Ana Martínez">Dra. Ana Martínez</SelectItem>
                    <SelectItem value="Dr. Miguel Torres">Dr. Miguel Torres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fecha *</label>
                  <Input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora *</label>
                  <Input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Duración</label>
                <Select
                  value={newSession.duration}
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={newSession.notes}
                  onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Motivo de la consulta..."
                />
              </div>
              <Button onClick={createSession} className="w-full">
                Programar Consulta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledSessions.length}</p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Video className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'in-progress').length}</p>
                <p className="text-sm text-muted-foreground">En curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSessions.length}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(sessions.map(s => s.patientEmail)).size}</p>
                <p className="text-sm text-muted-foreground">Pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por paciente o doctor..."
          className="pl-9"
        />
      </div>

      {/* Tabs de sesiones */}
      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Programadas ({scheduledSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial ({completedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No hay consultas programadas</h3>
                <p className="text-muted-foreground mb-4">Programa una nueva consulta de telemedicina</p>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Consulta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scheduledSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{session.patientName}</h3>
                          <p className="text-sm text-muted-foreground">{session.doctorName}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(session.scheduledAt), "dd MMM yyyy", { locale: es })}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.scheduledAt), "HH:mm")} ({session.duration} min)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session.status)}
                        <Button onClick={() => startCall(session)}>
                          <Phone className="h-4 w-4 mr-2" />
                          Iniciar Llamada
                        </Button>
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">{session.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No hay historial de consultas</h3>
                <p className="text-muted-foreground">Las consultas completadas aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedSessions.map((session) => (
                <Card key={session.id} className="opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{session.patientName}</h3>
                          <p className="text-sm text-muted-foreground">{session.doctorName}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(session.scheduledAt), "dd MMM yyyy", { locale: es })}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.duration} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session.status)}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Notas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
