import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StickyNote, Plus, Search, Edit, Trash2, Lock, Unlock, Save, X } from "lucide-react";
import { PageHeader } from "@/components/layout/ContentCard";

interface PatientNote {
  id: string;
  patient_id: string;
  note: string;
  note_type: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DoctorPatientNotesProps {
  patientId: string;
  doctorId: string;
}

const NOTE_TYPES = [
  { value: "general", label: "General", color: "bg-gray-500" },
  { value: "clinical", label: "Clínica", color: "bg-blue-500" },
  { value: "treatment", label: "Tratamiento", color: "bg-green-500" },
  { value: "followup", label: "Seguimiento", color: "bg-yellow-500" },
  { value: "important", label: "Importante", color: "bg-red-500" },
];

export const DoctorPatientNotes = ({ patientId, doctorId }: DoctorPatientNotesProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    note: "",
    note_type: "general",
    is_private: false,
  });

  const { data: notes = [], refetch } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PatientNote[];
    },
    enabled: !!patientId,
  });

  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile-notes', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', patientId)
        .single();
      return data;
    },
    enabled: !!patientId,
  });

  const filteredNotes = notes.filter(note =>
    note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.note_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNote = async () => {
    if (!newNote.note.trim()) {
      toast({
        title: "Error",
        description: "La nota no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('patient_notes').insert({
      patient_id: patientId,
      note: newNote.note,
      note_type: newNote.note_type,
      is_private: newNote.is_private,
      created_by: doctorId,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Nota guardada",
      description: "La nota clínica se ha guardado correctamente",
    });

    setNewNote({ note: "", note_type: "general", is_private: false });
    setIsAddingNote(false);
    refetch();
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('patient_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Nota eliminada",
      description: "La nota ha sido eliminada",
    });
    refetch();
  };

  const getNoteTypeInfo = (type: string | null) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
  };

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <StickyNote className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Selecciona un Paciente</h3>
        <p className="text-muted-foreground">
          Usa el selector de pacientes en el menú lateral para ver y agregar notas clínicas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notas Clínicas" 
        subtitle={patientProfile ? `Paciente: ${patientProfile.full_name}` : 'Cargando...'} 
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsAddingNote(true)} disabled={isAddingNote}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Nota
        </Button>
      </div>

      {isAddingNote && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Nueva Nota Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={newNote.note_type === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewNote({ ...newNote, note_type: type.value })}
                >
                  <div className={`w-2 h-2 rounded-full ${type.color} mr-2`} />
                  {type.label}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="Escribe la nota clínica..."
              value={newNote.note}
              onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
              rows={4}
            />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewNote({ ...newNote, is_private: !newNote.is_private })}
              >
                {newNote.is_private ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Nota Privada
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Nota Visible
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveNote}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <StickyNote className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay notas registradas</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotes.map((note) => {
              const typeInfo = getNoteTypeInfo(note.note_type);
              return (
                <Card key={note.id} className="group">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                          <Badge variant="outline" className="text-xs">
                            {typeInfo.label}
                          </Badge>
                          {note.is_private && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Privada
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
