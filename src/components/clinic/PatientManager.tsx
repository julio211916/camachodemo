import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Archive, Download, MoreHorizontal, 
  ChevronDown, User, Calendar, CreditCard, Tag,
  X, Save, FileText, QrCode, Users, Filter, Upload, Camera, Loader2, Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { InteractiveOdontogram } from "./InteractiveOdontogram";
import { PatientQRCode } from "./PatientQRCode";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Model3DViewerWithAnnotations } from "./Model3DViewerWithAnnotations";
import { animate } from "animejs";

interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  gender: string | null;
  birth_year: number | null;
  tags: string[];
  notes: string | null;
  is_archived: boolean;
  date_of_birth: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  last_visit?: string;
  total_payments?: number;
}

type SortField = 'full_name' | 'birth_year' | 'last_visit' | 'total_payments';
type SortOrder = 'asc' | 'desc';

const COMMON_TAGS = [
  'Hipertenso',
  'Diabético',
  'Embarazada',
  'Alérgico a anestesia',
  'Ortodoncia',
  'Implantes',
  'VIP',
  'Nuevo',
  'Seguimiento'
];

interface NewPatientForm {
  full_name: string;
  email: string;
  phone: string;
  birth_year: string;
  gender: string;
  address: string;
  notes: string;
  tags: string[];
  avatar_url: string | null;
}

export const PatientManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState("details");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  
  // Ref for animated fields
  const addressInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_year: "",
    gender: "",
    address: "",
    notes: "",
    tags: [] as string[]
  });

  // Form state for new patient
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({
    full_name: "",
    email: "",
    phone: "",
    birth_year: "",
    gender: "",
    address: "",
    notes: "",
    tags: [],
    avatar_url: null
  });

  // Fetch patients (exclude admins/staff/doctors from the patient list)
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', showArchived],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.rpc('get_patient_profiles', {
        p_search: null,
        p_show_archived: showArchived,
        p_limit: 1000,
      });

      if (error) throw error;

      // Get appointments and payments for each patient
      const enrichedPatients = await Promise.all((profiles || []).map(async (profile: any) => {
        // Get last appointment
        const { data: lastAppt } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('patient_email', profile.email)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false })
          .limit(1);

        // Get total payments
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total')
          .eq('patient_id', profile.user_id)
          .eq('status', 'paid');

        const totalPayments = (invoices || []).reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

        return {
          ...profile,
          tags: profile.tags || [],
          last_visit: lastAppt?.[0]?.appointment_date || null,
          total_payments: totalPayments,
        };
      }));

      return enrichedPatients as Patient[];
    },
  });

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let result = patients.filter(p => 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'full_name':
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
          break;
        case 'birth_year':
          aVal = a.birth_year || 0;
          bVal = b.birth_year || 0;
          break;
        case 'last_visit':
          aVal = a.last_visit || '';
          bVal = b.last_visit || '';
          break;
        case 'total_payments':
          aVal = a.total_payments || 0;
          bVal = b.total_payments || 0;
          break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    
    return result;
  }, [patients, searchQuery, sortField, sortOrder]);

  const visiblePatients = filteredPatients.slice(0, visibleCount);

  // Mutations
  const updatePatientMutation = useMutation({
    mutationFn: async (updates: Partial<Patient>) => {
      if (!selectedPatient) return;
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedPatient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: "Guardado", description: "Paciente actualizado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  });

  const archivePatientsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await supabase.from('profiles').update({ is_archived: true }).eq('id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setSelectedPatients(new Set());
      toast({ title: "Archivado", description: "Pacientes archivados correctamente" });
    }
  });

  // Create new patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: NewPatientForm) => {
      // Generate a unique user_id for patients created manually (not via auth)
      const tempUserId = crypto.randomUUID();
      
      // Upload photo if selected
      let avatarUrl = null;
      if (selectedPhotoFile) {
        const fileExt = selectedPhotoFile.name.split('.').pop();
        const fileName = `patient/${tempUserId}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedPhotoFile, { upsert: true });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }
      
      // Insert profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: tempUserId,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          birth_year: data.birth_year ? parseInt(data.birth_year) : null,
          gender: data.gender || null,
          address: data.address || null,
          notes: data.notes || null,
          tags: data.tags,
          avatar_url: avatarUrl,
          is_archived: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsAddingPatient(false);
      resetNewPatientForm();
      toast({ title: "Paciente agregado", description: "El nuevo paciente ha sido registrado" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo crear el paciente", 
        variant: "destructive" 
      });
    }
  });

  const resetNewPatientForm = () => {
    setNewPatientForm({
      full_name: "",
      email: "",
      phone: "",
      birth_year: "",
      gender: "",
      address: "",
      notes: "",
      tags: [],
      avatar_url: null
    });
    setPreviewPhoto(null);
    setSelectedPhotoFile(null);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Por favor selecciona una imagen", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen debe ser menor a 5MB", variant: "destructive" });
      return;
    }
    
    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Animation handlers
  const handleAddressInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    animate(e.target, {
      scale: [1, 1.02, 1],
      boxShadow: [
        '0 0 0 0 hsl(var(--primary) / 0)',
        '0 0 0 3px hsl(var(--primary) / 0.15)',
        '0 0 0 2px hsl(var(--primary) / 0.1)'
      ],
      duration: 300,
      easing: 'easeOutQuad'
    });
  }, []);

  const animateValidationError = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    animate(element, {
      translateX: [0, -6, 6, -4, 4, 0],
      borderColor: ['hsl(var(--destructive))', 'hsl(var(--border))'],
      duration: 400,
      easing: 'easeInOutQuad'
    });
  }, []);

  const animateSuccess = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    animate(element, {
      scale: [1, 1.05, 1],
      duration: 300,
      easing: 'easeOutBack'
    });
  }, []);

  const handleCreatePatient = () => {
    if (!newPatientForm.full_name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      // Animate error on name field
      const nameInput = document.querySelector('input[placeholder="Nombre del paciente"]') as HTMLElement;
      animateValidationError(nameInput);
      return;
    }
    if (!newPatientForm.email.trim()) {
      toast({ title: "Error", description: "El email es requerido", variant: "destructive" });
      // Animate error on email field
      const emailInput = document.querySelector('input[placeholder="correo@ejemplo.com"]') as HTMLElement;
      animateValidationError(emailInput);
      return;
    }
    
    // Animate submit button on success
    animateSuccess(submitButtonRef.current);
    createPatientMutation.mutate(newPatientForm);
  };

  const addNewPatientTag = (tag: string) => {
    if (!newPatientForm.tags.includes(tag)) {
      setNewPatientForm({ ...newPatientForm, tags: [...newPatientForm.tags, tag] });
    }
  };

  const removeNewPatientTag = (tag: string) => {
    setNewPatientForm({ ...newPatientForm, tags: newPatientForm.tags.filter(t => t !== tag) });
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      full_name: patient.full_name,
      email: patient.email,
      phone: patient.phone || "",
      birth_year: patient.birth_year?.toString() || "",
      gender: patient.gender || "",
      address: patient.address || "",
      notes: patient.notes || "",
      tags: patient.tags || []
    });
    setDetailTab("details");
  };

  const handleSave = () => {
    updatePatientMutation.mutate({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      birth_year: editForm.birth_year ? parseInt(editForm.birth_year) : null,
      gender: editForm.gender || null,
      address: editForm.address || null,
      notes: editForm.notes || null,
      tags: editForm.tags
    });
  };

  const togglePatientSelection = (id: string) => {
    const newSelection = new Set(selectedPatients);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPatients(newSelection);
  };

  const selectAll = () => {
    if (selectedPatients.size === visiblePatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(visiblePatients.map(p => p.id)));
    }
  };

  const addTag = (tag: string) => {
    if (!editForm.tags.includes(tag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) });
  };

  const getAge = (birthYear: number | null) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - birthYear;
  };

  const exportSelected = () => {
    const selectedData = patients.filter(p => selectedPatients.has(p.id));
    const csv = [
      ['Nombre', 'Email', 'Teléfono', 'Género', 'Edad', 'Tags', 'Total Pagos'].join(','),
      ...selectedData.map(p => [
        p.full_name,
        p.email,
        p.phone || '',
        p.gender || '',
        getAge(p.birth_year) || '',
        (p.tags || []).join(';'),
        p.total_payments || 0
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pacientes.csv';
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b bg-card flex items-center gap-4 flex-wrap">
          <Button onClick={() => setIsAddingPatient(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => archivePatientsMutation.mutate(Array.from(selectedPatients))}
            disabled={selectedPatients.size === 0}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            Archivar Seleccionados
          </Button>
          
          <Button 
            variant="outline" 
            onClick={exportSelected}
            disabled={selectedPatients.size === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Seleccionados
          </Button>
          
          <div className="flex-1" />
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button 
            variant={showArchived ? "default" : "outline"} 
            size="icon"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>

        {/* Column Headers */}
        <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="w-8 flex-shrink-0">
            <Checkbox 
              checked={selectedPatients.size === visiblePatients.length && visiblePatients.length > 0}
              onCheckedChange={selectAll}
            />
          </div>
          <span className="text-xs">Showing {visiblePatients.length}/{filteredPatients.length}</span>
          
          <div className="flex items-center gap-2 ml-auto">
            {(['full_name', 'birth_year', 'last_visit', 'total_payments'] as SortField[]).map(field => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (sortField === field) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField(field);
                    setSortOrder('asc');
                  }
                }}
                className="gap-1"
              >
                {field === 'full_name' && 'Nombre'}
                {field === 'birth_year' && 'Edad'}
                {field === 'last_visit' && 'Última visita'}
                {field === 'total_payments' && 'Total pagos'}
                {sortField === field && (
                  <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="divide-y">
              {visiblePatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-4 py-3 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedPatients.has(patient.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); togglePatientSelection(patient.id); }}>
                    <Checkbox checked={selectedPatients.has(patient.id)} />
                  </div>
                  
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={patient.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {patient.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{patient.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                  </div>
                  
                  {patient.birth_year && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Edad {getAge(patient.birth_year)}
                    </Badge>
                  )}
                  
                  {patient.gender && (
                    <Badge variant="outline" className={`${
                      patient.gender === 'female' ? 'bg-pink-500/10 text-pink-600 border-pink-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {patient.gender === 'female' ? '♀' : '♂'}
                    </Badge>
                  )}
                  
                  {patient.last_visit && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Última visita {formatDistanceToNow(new Date(patient.last_visit), { locale: es, addSuffix: false })}
                    </Badge>
                  )}
                  
                  {(patient.total_payments || 0) > 0 && (
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
                      Total ${patient.total_payments?.toLocaleString()}
                    </Badge>
                  )}
                  
                  {patient.tags?.slice(0, 1).map(tag => (
                    <Badge key={tag} className="bg-primary/10 text-primary">
                      {tag}
                    </Badge>
                  ))}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSelectPatient(patient)}>
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archivePatientsMutation.mutate([patient.id])}>
                        Archivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
          
          {visibleCount < filteredPatients.length && (
            <div className="p-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(v => v + 10)}
                className="gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Mostrar más
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l bg-card overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b bg-primary/5 flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage src={selectedPatient.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {selectedPatient.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold">{selectedPatient.full_name}</h3>
                <Badge variant="secondary">Paciente</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPatient(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
                <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <User className="w-4 h-4 mr-2" />
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="odontogram" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <FileText className="w-4 h-4 mr-2" />
                  Odontograma
                </TabsTrigger>
                <TabsTrigger value="3d-viewer" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Users className="w-4 h-4 mr-2" />
                  Modelos 3D
                </TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Calendar className="w-4 h-4 mr-2" />
                  Citas
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="details" className="m-0 p-4 space-y-4">
                  {/* Photo Upload */}
                  <div className="flex justify-center">
                    <ProfilePhotoUpload 
                      userId={selectedPatient.user_id} 
                      userType="patient" 
                      currentPhotoUrl={selectedPatient.avatar_url || undefined}
                      userName={selectedPatient.full_name}
                      onPhotoChange={(url) => updatePatientMutation.mutate({ avatar_url: url })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input 
                        value={editForm.full_name} 
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Año de nacimiento</Label>
                        <Input 
                          type="number"
                          value={editForm.birth_year} 
                          onChange={(e) => setEditForm({ ...editForm, birth_year: e.target.value })}
                          placeholder="2000"
                        />
                      </div>
                      <div>
                        <Label>Género</Label>
                        <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Masculino ♂</SelectItem>
                            <SelectItem value="female">Femenino ♀</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Teléfono</Label>
                      <Input 
                        value={editForm.phone} 
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+1 555-555-55"
                      />
                    </div>
                    
                    <div>
                      <Label>Email</Label>
                      <Input value={editForm.email} disabled className="bg-muted" />
                    </div>
                    
                    <div>
                      <Label>Dirección</Label>
                      <Input 
                        value={editForm.address} 
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Notas</Label>
                      <Textarea 
                        value={editForm.notes} 
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Notas del paciente..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Etiquetas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editForm.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Select onValueChange={addTag}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Agregar etiqueta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_TAGS.filter(t => !editForm.tags.includes(t)).map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="odontogram" className="m-0 p-2">
                  <InteractiveOdontogram 
                    patientId={selectedPatient.user_id} 
                    patientName={selectedPatient.full_name}
                  />
                </TabsContent>

                <TabsContent value="3d-viewer" className="m-0 p-2 h-[500px]">
                  <Model3DViewerWithAnnotations
                    patientId={selectedPatient.user_id}
                    patientName={selectedPatient.full_name}
                  />
                </TabsContent>

                <TabsContent value="appointments" className="m-0 p-4">
                  <PatientAppointments patientEmail={selectedPatient.email} />
                </TabsContent>

                <TabsContent value="qr" className="m-0 p-4">
                  <PatientQRCode 
                    patientId={selectedPatient.user_id}
                    patientName={selectedPatient.full_name}
                    patientEmail={selectedPatient.email}
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="p-3 border-t flex items-center gap-2 bg-muted/30">
              <Button 
                variant="outline" 
                onClick={() => archivePatientsMutation.mutate([selectedPatient.id])}
                className="gap-2"
              >
                <Archive className="w-4 h-4" />
                Archivar
              </Button>
              <div className="flex-1" />
              <Button 
                onClick={handleSave}
                disabled={updatePatientMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </Button>
              <Button variant="ghost" onClick={() => setSelectedPatient(null)}>
                <X className="w-4 h-4" />
                Cerrar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Patient Dialog */}
      <Dialog open={isAddingPatient} onOpenChange={(open) => { setIsAddingPatient(open); if (!open) resetNewPatientForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nuevo Paciente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Photo Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-border cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={previewPhoto || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {newPatientForm.full_name ? newPatientForm.full_name.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">Clic para agregar foto</p>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre completo *</Label>
                  <Input
                    value={newPatientForm.full_name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, full_name: e.target.value })}
                    placeholder="Nombre del paciente"
                  />
                </div>
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    placeholder="+52 555 555 5555"
                  />
                </div>
                <div>
                  <Label>Año de nacimiento</Label>
                  <Input
                    type="number"
                    value={newPatientForm.birth_year}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, birth_year: e.target.value })}
                    placeholder="1990"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Género</Label>
                  <Select value={newPatientForm.gender} onValueChange={(v) => setNewPatientForm({ ...newPatientForm, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino ♂</SelectItem>
                      <SelectItem value="female">Femenino ♀</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    ref={addressInputRef}
                    value={newPatientForm.address}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                    onFocus={handleAddressInputFocus}
                    placeholder="Dirección"
                    className="transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={newPatientForm.notes}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, notes: e.target.value })}
                  placeholder="Notas adicionales del paciente..."
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {newPatientForm.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeNewPatientTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.filter(t => !newPatientForm.tags.includes(t)).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => addNewPatientTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsAddingPatient(false); resetNewPatientForm(); }}>
              Cancelar
            </Button>
            <Button 
              ref={submitButtonRef}
              onClick={handleCreatePatient}
              disabled={createPatientMutation.isPending}
              className="gap-2 transition-all"
            >
              {createPatientMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Crear Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-component for patient appointments
const PatientAppointments = ({ patientEmail }: { patientEmail: string }) => {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient-appointments', patientEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', patientEmail)
        .order('appointment_date', { ascending: false });
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando citas...</div>;
  }

  if (appointments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Sin citas registradas</div>;
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt: any) => (
        <Card key={apt.id} className="p-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              apt.status === 'completed' ? 'bg-green-500' :
              apt.status === 'confirmed' ? 'bg-blue-500' :
              apt.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <div className="flex-1">
              <p className="font-medium">{apt.service_name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(apt.appointment_date).toLocaleDateString()} - {apt.appointment_time}
              </p>
            </div>
            <Badge variant="outline">{apt.status}</Badge>
          </div>
          {apt.notes && (
            <p className="text-sm text-muted-foreground mt-2 pl-5">{apt.notes}</p>
          )}
        </Card>
      ))}
    </div>
  );
};
