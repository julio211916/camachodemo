import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, Filter, AlertCircle, Clock, User, Stethoscope, DollarSign } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  name: string;
  patient_id: string;
  doctor_id: string | null;
  status: string | null;
  start_date: string;
  end_date: string | null;
  cost: number | null;
  diagnosis: string | null;
  notes: string | null;
}

interface PendingTreatmentsWidgetProps {
  compact?: boolean;
  patientId?: string;
}

export const PendingTreatmentsWidget = ({ compact = false, patientId }: PendingTreatmentsWidgetProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'name'>('date');

  // Fetch treatments
  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ['treatments-pending', patientId],
    queryFn: async () => {
      let query = supabase
        .from('treatments')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Treatment[];
    },
  });

  // Fetch patient profiles for names
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      if (error) throw error;
      return data;
    },
  });

  // Create patient name lookup
  const patientNames = useMemo(() => {
    const lookup: Record<string, string> = {};
    profiles.forEach(p => {
      lookup[p.user_id] = p.full_name;
    });
    return lookup;
  }, [profiles]);

  // Filter and sort treatments
  const filteredTreatments = useMemo(() => {
    let result = treatments.filter(t => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const name = t.name.toLowerCase();
        const patientName = patientNames[t.patient_id]?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        if (!name.includes(query) && !patientName.includes(query)) return false;
      }
      
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return (b.cost || 0) - (a.cost || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });

    return result;
  }, [treatments, statusFilter, searchQuery, sortBy, patientNames]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = treatments.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completed = treatments.filter(t => t.status === 'completed');
    const totalValue = pending.reduce((sum, t) => sum + (t.cost || 0), 0);
    
    return {
      pending: pending.length,
      completed: completed.length,
      inProgress: treatments.filter(t => t.status === 'in_progress').length,
      totalValue,
    };
  }, [treatments]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">En Progreso</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pendiente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Sin estado</Badge>;
    }
  };

  const getDaysInfo = (startDate: string, endDate: string | null) => {
    const start = parseISO(startDate);
    const now = new Date();
    const daysSinceStart = differenceInDays(now, start);
    
    if (endDate) {
      const end = parseISO(endDate);
      const totalDays = differenceInDays(end, start);
      const progress = Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100));
      return { daysSinceStart, totalDays, progress };
    }
    
    return { daysSinceStart, totalDays: null, progress: null };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pendientes</span>
          <span className="font-bold text-primary">{stats.pending}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">En Progreso</span>
          <span className="font-bold text-blue-600">{stats.inProgress}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Valor Total</span>
          <span className="font-bold text-green-600">
            ${stats.totalValue.toLocaleString('es-MX')}
          </span>
        </div>
        <ScrollArea className="h-24">
          <div className="space-y-2">
            {filteredTreatments.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                <span className="truncate flex-1">{t.name}</span>
                {getStatusBadge(t.status)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-muted-foreground">Pendientes</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">En Progreso</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Completados</span>
          </div>
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Valor Pendiente</span>
          </div>
          <p className="text-xl font-bold text-primary">
            ${(stats.totalValue / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tratamiento o paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="cost">Costo</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Treatments List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-4">
          {filteredTreatments.map(treatment => {
            const { daysSinceStart, progress } = getDaysInfo(treatment.start_date, treatment.end_date);
            
            return (
              <div 
                key={treatment.id}
                className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{treatment.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{patientNames[treatment.patient_id] || 'Paciente'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {treatment.cost && (
                      <span className="text-sm font-medium text-green-600">
                        ${treatment.cost.toLocaleString('es-MX')}
                      </span>
                    )}
                    {getStatusBadge(treatment.status)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Inicio: {format(parseISO(treatment.start_date), 'd MMM yyyy', { locale: es })}</span>
                  <span>Días: {daysSinceStart}</span>
                </div>
                
                {progress !== null && (
                  <div className="mt-2">
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredTreatments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Stethoscope className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No hay tratamientos</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
