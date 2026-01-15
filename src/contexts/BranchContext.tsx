import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
}

export interface BranchSummary {
  location_id: string;
  location_name: string;
  total_patients: number;
  total_appointments_today: number;
  pending_appointments: number;
  income_today: number;
  expenses_today: number;
}

interface BranchContextType {
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  branches: Branch[];
  loading: boolean;
  viewMode: 'local' | 'global';
  setViewMode: (mode: 'local' | 'global') => void;
  canViewGlobal: boolean;
  branchSummaries: BranchSummary[];
  refreshSummaries: () => Promise<void>;
  getLocationFilter: () => string | null;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { userRole, profile, isAdminMaster } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
  const [loading, setLoading] = useState(true);
  const [branchSummaries, setBranchSummaries] = useState<BranchSummary[]>([]);

  // Admin master can view global, regular admin/doctor only sees their branch
  const canViewGlobal = isAdminMaster;

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setBranches(data);
        
        // If user has a location_id and is not admin master, set that as their current branch
        if (profile?.location_id && !isAdminMaster) {
          const userBranch = data.find(b => b.id === profile.location_id);
          if (userBranch) {
            setCurrentBranch(userBranch);
          } else {
            setCurrentBranch(data[0]);
          }
        } else {
          setCurrentBranch(data[0]);
        }
      }
      setLoading(false);
    };
    fetchBranches();
  }, [profile?.location_id, isAdminMaster]);

  const refreshSummaries = async () => {
    // Fetch summaries manually since RPC may not exist yet
    const { data: locations } = await supabase.from('locations').select('id, name').eq('is_active', true);
    if (locations) {
      const summaries: BranchSummary[] = locations.map(loc => ({
        location_id: loc.id,
        location_name: loc.name,
        total_patients: 0,
        total_appointments_today: 0,
        pending_appointments: 0,
        income_today: 0,
        expenses_today: 0,
      }));
      setBranchSummaries(summaries);
    }
  };

  useEffect(() => {
    refreshSummaries();
  }, []);

  const getLocationFilter = (): string | null => {
    if (viewMode === 'global' && canViewGlobal) return null;
    return currentBranch?.id || null;
  };

  return (
    <BranchContext.Provider value={{ currentBranch, setCurrentBranch, branches, loading, viewMode, setViewMode, canViewGlobal, branchSummaries, refreshSummaries, getLocationFilter }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch must be used within BranchProvider');
  return context;
}
