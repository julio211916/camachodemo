import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Gift, 
  Star,
  Trophy,
  Video,
  FileText,
  Bell,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Send,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LoyaltyModule = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch referrals data
  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals-loyalty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch appointments for retention analysis
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-loyalty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate loyalty metrics
  const metrics = {
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    referralRate: appointments.length > 0 
      ? ((referrals.filter(r => r.status === 'completed').length / appointments.length) * 100).toFixed(1)
      : 0,
    retentionRate: 85, // Demo value
    avgVisitsPerPatient: 3.2 // Demo value
  };

  const educationalVideos = [
    { id: "1", title: "Importancia del cepillado correcto", duration: "3:45", views: 1250 },
    { id: "2", title: "Cómo usar el hilo dental", duration: "2:30", views: 890 },
    { id: "3", title: "Blanqueamiento dental: Lo que debes saber", duration: "5:15", views: 2100 },
    { id: "4", title: "Ortodoncia invisible vs brackets", duration: "4:20", views: 1560 },
    { id: "5", title: "Prevención de caries en niños", duration: "3:00", views: 980 }
  ];

  const documentTemplates = [
    { id: "1", name: "Guía de cuidados post-tratamiento", type: "PDF", downloads: 450 },
    { id: "2", name: "Instrucciones para brackets", type: "PDF", downloads: 320 },
    { id: "3", name: "Dieta para blanqueamiento", type: "PDF", downloads: 280 },
    { id: "4", name: "Ejercicios mandibulares", type: "PDF", downloads: 150 },
    { id: "5", name: "Guía de emergencias dentales", type: "PDF", downloads: 200 }
  ];

  const reminderTypes = [
    { type: "checkup", name: "Revisión semestral", count: 45, color: "bg-blue-500" },
    { type: "cleaning", name: "Limpieza dental", count: 32, color: "bg-green-500" },
    { type: "followup", name: "Seguimiento tratamiento", count: 28, color: "bg-amber-500" },
    { type: "birthday", name: "Cumpleaños", count: 12, color: "bg-pink-500" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.retentionRate}%</p>
                  <p className="text-xs text-muted-foreground">Retención</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics.totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Referidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{metrics.completedReferrals}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.avgVisitsPerPatient}</p>
                  <p className="text-xs text-muted-foreground">Visitas Prom.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{metrics.referralRate}%</p>
                  <p className="text-xs text-muted-foreground">Tasa Referidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Fidelización de Pacientes
          </CardTitle>
          <CardDescription>
            Herramientas para mantener a tus pacientes comprometidos y regresando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="gap-2">
                <Award className="w-4 h-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Videos 3D
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="w-4 h-4" />
                Plantillas
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="w-4 h-4" />
                Recordatorios
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                <Gift className="w-4 h-4" />
                Referidos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Loyalty Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Programa de Puntos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nivel actual</span>
                      <Badge className="bg-amber-500 text-white">Gold</Badge>
                    </div>
                    <Progress value={75} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      75% para alcanzar nivel Platinum
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">1,250</p>
                        <p className="text-xs text-muted-foreground">Puntos actuales</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">500</p>
                        <p className="text-xs text-muted-foreground">Para siguiente nivel</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">3</p>
                        <p className="text-xs text-muted-foreground">Recompensas canjeadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Send className="w-4 h-4" />
                      Enviar recordatorio masivo
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Gift className="w-4 h-4" />
                      Crear promoción especial
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generar campaña con IA
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="w-4 h-4" />
                      Programar seguimientos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <ScrollArea className="h-[400px]">
                <div className="grid md:grid-cols-2 gap-4">
                  {educationalVideos.map((video) => (
                    <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-16 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                            <Video className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{video.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{video.duration}</span>
                              <span>{video.views.toLocaleString()} vistas</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4">
                <Button className="w-full">
                  <Video className="w-4 h-4 mr-2" />
                  Subir Nuevo Video
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {documentTemplates.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{doc.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} • {doc.downloads} descargas
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Enviar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Nueva Plantilla
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="reminders">
              <div className="space-y-6">
                {/* Reminder Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {reminderTypes.map((reminder) => (
                    <Card key={reminder.type}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${reminder.color}`} />
                          <div>
                            <p className="text-xl font-bold">{reminder.count}</p>
                            <p className="text-xs text-muted-foreground">{reminder.name}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pending Reminders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recordatorios Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Los recordatorios automáticos están activos</p>
                      <p className="text-sm mt-2">Se envían 24 y 2 horas antes de cada cita</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="referrals">
              <div className="space-y-4">
                {referrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No hay referidos registrados</p>
                    <p className="text-sm mt-2">
                      Los pacientes pueden compartir su código de referido para obtener descuentos
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div 
                          key={referral.id}
                          className="p-4 rounded-xl border border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{referral.referral_code}</p>
                              <p className="text-sm text-muted-foreground">{referral.referred_email}</p>
                            </div>
                            <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                              {referral.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
