import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface RevenueChartWidgetProps {
  compact?: boolean;
}

export const RevenueChartWidget = ({ compact = false }: RevenueChartWidgetProps) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const dateRange = useMemo(() => {
    const today = new Date();
    if (period === 'week') {
      return {
        start: subDays(today, 6),
        end: today,
      };
    }
    return {
      start: startOfMonth(today),
      end: endOfMonth(today),
    };
  }, [period]);

  // Fetch transactions for revenue
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-revenue', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch invoices as fallback
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-revenue', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.end, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Process data for chart
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Calculate income from transactions
      const dayTransactions = transactions.filter(t => t.transaction_date === dateStr);
      const income = dayTransactions
        .filter(t => t.transaction_type === 'ingreso')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = dayTransactions
        .filter(t => t.transaction_type === 'egreso')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Fallback to invoices if no transactions
      const dayInvoices = invoices.filter(i => 
        format(parseISO(i.created_at), 'yyyy-MM-dd') === dateStr
      );
      const invoiceTotal = dayInvoices.reduce((sum, i) => sum + Number(i.total), 0);
      
      return {
        date: format(day, period === 'week' ? 'EEE' : 'd MMM', { locale: es }),
        fullDate: dateStr,
        ingresos: income || invoiceTotal,
        gastos: expenses,
        neto: (income || invoiceTotal) - expenses,
      };
    });
  }, [transactions, invoices, dateRange, period]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalIncome = chartData.reduce((sum, d) => sum + d.ingresos, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.gastos, 0);
    const net = totalIncome - totalExpenses;
    const avgDaily = totalIncome / chartData.length || 0;
    
    return { totalIncome, totalExpenses, net, avgDaily };
  }, [chartData]);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <p className="text-lg font-bold text-green-600">
                ${totals.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gastos</p>
            <p className="text-lg font-bold text-red-500">
              ${totals.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <Area 
                type="monotone" 
                dataKey="ingresos" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.2)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Gastos</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-muted-foreground">Total Ingresos</p>
          <p className="text-lg font-bold text-green-600">
            ${totals.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-muted-foreground">Total Gastos</p>
          <p className="text-lg font-bold text-red-500">
            ${totals.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${totals.net >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-amber-500/10 border-amber-500/20'} border`}>
          <p className="text-xs text-muted-foreground">Balance Neto</p>
          <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-primary' : 'text-amber-600'}`}>
            ${totals.net.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-muted-foreground">Promedio Diario</p>
          <p className="text-lg font-bold text-blue-600">
            ${totals.avgDaily.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString('es-MX')}`, '']}
              labelFormatter={(label) => `${label}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="ingresos" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
