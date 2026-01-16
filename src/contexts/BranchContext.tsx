import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
  confirmed_appointments: number;
  income_today: number;
  income_week: number;
  income_month: number;
  expenses_today: number;
}

export type DateFilter = 'today' | 'week' | 'month' | 'all';

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
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  getDateRange: () => { start: Date; end: Date } | null;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { userRole, profile, isAdminMaster } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
  const [loading, setLoading] = useState(true);
  const [branchSummaries, setBranchSummaries] = useState<BranchSummary[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const canViewGlobal = isAdminMaster;

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'all':
        return null;
    }
  }, [dateFilter]);

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

  const refreshSummaries = useCallback(async () => {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('is_active', true);

    if (!locations) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const summaries: BranchSummary[] = await Promise.all(
      locations.map(async (loc) => {
        // Citas de hoy
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', loc.id)
          .eq('appointment_date', today);

        // Citas pendientes
        const { count: pendingCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', loc.id)
          .eq('status', 'pending');

        // Citas confirmadas
        const { count: confirmedCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', loc.id)
          .eq('status', 'confirmed');

        // Ingresos de hoy
        const { data: todayTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('location_id', loc.id)
          .eq('transaction_type', 'income')
          .eq('status', 'completed')
          .gte('transaction_date', today);

        const incomeToday = todayTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Ingresos de la semana
        const { data: weekTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('location_id', loc.id)
          .eq('transaction_type', 'income')
          .eq('status', 'completed')
          .gte('transaction_date', weekStart);

        const incomeWeek = weekTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Ingresos del mes
        const { data: monthTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('location_id', loc.id)
          .eq('transaction_type', 'income')
          .eq('status', 'completed')
          .gte('transaction_date', monthStart);

        const incomeMonth = monthTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Gastos de hoy
        const { data: todayExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('location_id', loc.id)
          .gte('expense_date', today);

        const expensesToday = todayExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

        // Pacientes totales (aproximación por perfiles asignados a la sucursal)
        const { count: patientsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', loc.id);

        return {
          location_id: loc.id,
          location_name: loc.name,
          total_patients: patientsCount || 0,
          total_appointments_today: todayCount || 0,
          pending_appointments: pendingCount || 0,
          confirmed_appointments: confirmedCount || 0,
          income_today: incomeToday,
          income_week: incomeWeek,
          income_month: incomeMonth,
          expenses_today: expensesToday,
        };
      })
    );

    setBranchSummaries(summaries);
  }, []);

  useEffect(() => {
    refreshSummaries();
  }, [refreshSummaries]);

  const getLocationFilter = (): string | null => {
    if (viewMode === 'global' && canViewGlobal) return null;
    return currentBranch?.id || null;
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        setCurrentBranch,
        branches,
        loading,
        viewMode,
        setViewMode,
        canViewGlobal,
        branchSummaries,
        refreshSummaries,
        getLocationFilter,
        dateFilter,
        setDateFilter,
        getDateRange,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch must be used within BranchProvider');
  return context;
}
