import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, Plus, Printer, Calendar, User,
  Loader2, XCircle, Eye, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientEvolutionsSectionProps {
  patientId: string;
  patientName: string;
}

const evolutionTypes = [
  { value: 'general', label: 'General' },
  { value: 'consultation', label: 'Consulta' },
  { value: 'procedure', label: 'Procedimiento' },
  { value: 'follow-up', label: 'Seguimiento' },
  { value: 'emergency', label: 'Urgencia' }
];

export const PatientEvolutionsSection = ({ patientId, patientName }: PatientEvolutionsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [showCancelled, setShowCancelled] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvolution, setSelectedEvolution] = useState<any>(null);
  const [content, setContent] = useState("");
  const [evolutionType, setEvolutionType] = useState("general");
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch evolutions
  const { data: evolutions = [], isLoading } = useQuery({
    queryKey: ['patient-evolutions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_evolutions')
        .select(`
          *,
          doctor:doctors(id, specialty, user_id)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Create evolution mutation
  const createEvolution = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('patient_evolutions').insert({
        patient_id: patientId,
        content,
        evolution_type: evolutionType,
        is_private: isPrivate,
        doctor_id: null // Would be set based on current user if they're a doctor
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-evolutions', patientId] });
      toast({ title: "Evolución creada", description: "La nota de evolución ha sido guardada" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Cancel evolution mutation
  const cancelEvolution = useMutation({
    mutationFn: async (evolutionId: string) => {
      const { error } = await supabase
        .from('patient_evolutions')
        .update({ 
          is_cancelled: true, 
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id 
        })
        .eq('id', evolutionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-evolutions', patientId] });
      toast({ title: "Evolución anulada" });
    }
  });

  const resetForm = () => {
    setContent("");
    setEvolutionType("general");
    setIsPrivate(false);
    setSelectedEvolution(null);
  };

  const filteredEvolutions = evolutions.filter((e: any) => {
    if (!showCancelled && e.is_cancelled) return false;
    // In real app, filter by doctor_id for 'mine' view
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Evoluciones Clínicas
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva evolución
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-cancelled-evolutions"
                  checked={showCancelled}
                  onCheckedChange={setShowCancelled}
                />
                <Label htmlFor="show-cancelled-evolutions" className="text-sm">Mostrar anuladas</Label>
              </div>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="mt-4">
            <TabsList>
              <TabsTrigger value="all">Todas las evoluciones</TabsTrigger>
              <TabsTrigger value="mine">Solo mis evoluciones</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvolutions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron evoluciones</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Crear primera evolución
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredEvolutions.map((evolution: any) => (
                  <Card 
                    key={evolution.id}
                    className={cn(
                      "transition-colors hover:bg-muted/50",
                      evolution.is_cancelled && "opacity-60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {evolutionTypes.find(t => t.value === evolution.evolution_type)?.label || evolution.evolution_type}
                            </Badge>
                            {evolution.is_private && (
                              <Badge variant="outline">Privado</Badge>
                            )}
                            {evolution.is_cancelled && (
                              <Badge variant="destructive">Anulado</Badge>
                            )}
                          </div>
                          
                          <div 
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: evolution.content }}
                          />
                          
                          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(evolution.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {evolution.doctor?.specialty || 'Sistema'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedEvolution(evolution);
                              setContent(evolution.content);
                              setEvolutionType(evolution.evolution_type);
                              setIsPrivate(evolution.is_private);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!evolution.is_cancelled && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => cancelEvolution.mutate(evolution.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Evolution Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvolution ? 'Ver Evolución' : 'Nueva Evolución Clínica'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de evolución</Label>
                <Select value={evolutionType} onValueChange={setEvolutionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {evolutionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private">Nota privada</Label>
              </div>
            </div>

            <div>
              <Label>Contenido</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escriba la nota de evolución..."
                rows={10}
                readOnly={!!selectedEvolution}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              {selectedEvolution ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!selectedEvolution && (
              <Button 
                onClick={() => createEvolution.mutate()}
                disabled={!content.trim() || createEvolution.isPending}
              >
                {createEvolution.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  'Guardar Evolución'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
