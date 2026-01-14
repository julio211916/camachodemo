import { useState, useEffect, useRef } from 'react';
import { Search, User, X, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePatientContext } from '@/contexts/PatientContext';
import { cn } from '@/lib/utils';

interface PatientSelectorProps {
  collapsed?: boolean;
}

export const PatientSelector = ({ collapsed }: PatientSelectorProps) => {
  const {
    selectedPatient,
    setSelectedPatient,
    patients,
    loadingPatients,
    searchPatients,
    searchQuery,
    clearSelection,
  } = usePatientContext();

  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchPatients]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelect = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setOpen(false);
    setLocalSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSelection();
  };

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-10 h-10 rounded-lg',
              selectedPatient && 'ring-2 ring-primary'
            )}
          >
            {selectedPatient ? (
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedPatient.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(selectedPatient.fullName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-72 p-0">
          <PatientListContent
            patients={patients}
            loadingPatients={loadingPatients}
            localSearch={localSearch}
            setLocalSearch={setLocalSearch}
            handleSelect={handleSelect}
            getInitials={getInitials}
            searchInputRef={searchInputRef}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="px-3 py-2">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        Paciente Activo
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-2"
          >
            {selectedPatient ? (
              <div className="flex items-center gap-2 truncate">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={selectedPatient.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(selectedPatient.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{selectedPatient.fullName}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Seleccionar paciente...</span>
            )}
            <div className="flex items-center gap-1">
              {selectedPatient && (
                <X
                  className="w-4 h-4 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <PatientListContent
            patients={patients}
            loadingPatients={loadingPatients}
            localSearch={localSearch}
            setLocalSearch={setLocalSearch}
            handleSelect={handleSelect}
            getInitials={getInitials}
            searchInputRef={searchInputRef}
          />
        </PopoverContent>
      </Popover>

      {selectedPatient && (
        <Badge variant="secondary" className="mt-2 w-full justify-center text-xs">
          ID: {selectedPatient.userId.slice(0, 8)}...
        </Badge>
      )}
    </div>
  );
};

interface PatientListContentProps {
  patients: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }>;
  loadingPatients: boolean;
  localSearch: string;
  setLocalSearch: (value: string) => void;
  handleSelect: (patient: PatientListContentProps['patients'][0]) => void;
  getInitials: (name: string) => string;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const PatientListContent = ({
  patients,
  loadingPatients,
  localSearch,
  setLocalSearch,
  handleSelect,
  getInitials,
  searchInputRef,
}: PatientListContentProps) => {
  return (
    <div className="flex flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar paciente..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="h-64">
        {loadingPatients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : patients.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {localSearch ? 'No se encontraron pacientes' : 'No hay pacientes'}
          </div>
        ) : (
          <div className="p-1">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelect(patient)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={patient.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(patient.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{patient.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PatientSelector;
