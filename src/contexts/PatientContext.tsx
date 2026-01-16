import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PatientInfo {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

interface PatientContextType {
  selectedPatient: PatientInfo | null;
  setSelectedPatient: (patient: PatientInfo | null) => void;
  selectPatientById: (userId: string) => Promise<void>;
  clearSelection: () => void;
  patients: PatientInfo[];
  loadingPatients: boolean;
  searchPatients: (query: string) => void;
  searchQuery: string;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider = ({ children }: PatientProviderProps) => {
  const { userRole } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients list for staff/doctors
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'staff' && userRole !== 'doctor') return;

    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const { data, error } = await supabase.rpc('get_patient_profiles', {
          p_search: searchQuery || null,
          p_show_archived: false,
          p_limit: 100,
        });

        if (error) throw error;

        setPatients(
          (data || []).map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            fullName: p.full_name,
            email: p.email,
            phone: p.phone,
            avatarUrl: p.avatar_url,
          }))
        );
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [userRole, searchQuery]);

  const selectPatientById = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_patient_profile', {
        p_user_id: userId,
      });

      if (error) throw error;

      if (data) {
        setSelectedPatient({
          id: (data as any).id,
          userId: (data as any).user_id,
          fullName: (data as any).full_name,
          email: (data as any).email,
          phone: (data as any).phone,
          avatarUrl: (data as any).avatar_url,
        });
      }
    } catch (err) {
      console.error('Error selecting patient:', err);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  const searchPatients = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <PatientContext.Provider
      value={{
        selectedPatient,
        setSelectedPatient,
        selectPatientById,
        clearSelection,
        patients,
        loadingPatients,
        searchPatients,
        searchQuery,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
