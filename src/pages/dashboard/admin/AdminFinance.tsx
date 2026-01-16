import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data for charts
const monthlyData = [
  { mes: 'Ene', ingresos: 145000, gastos: 78000, utilidad: 67000 },
  { mes: 'Feb', ingresos: 162000, gastos: 82000, utilidad: 80000 },
  { mes: 'Mar', ingresos: 155000, gastos: 75000, utilidad: 80000 },
  { mes: 'Abr', ingresos: 178000, gastos: 88000, utilidad: 90000 },
  { mes: 'May', ingresos: 165000, gastos: 79000, utilidad: 86000 },
  { mes: 'Jun', ingresos: 192000, gastos: 92000, utilidad: 100000 },
];

const expenseCategories = [
  { name: 'Inventario', value: 45000, color: '#3b82f6' },
  { name: 'Nómina', value: 28000, color: '#22c55e' },
  { name: 'Envíos', value: 12000, color: '#f59e0b' },
  { name: 'Servicios', value: 8000, color: '#8b5cf6' },
  { name: 'Otros', value: 5000, color: '#6b7280' },
];

const paymentMethods = [
  { name: 'Efectivo', value: 35, color: '#22c55e' },
  { name: 'Tarjeta', value: 40, color: '#3b82f6' },
  { name: 'Transferencia', value: 20, color: '#8b5cf6' },
  { name: 'Crédito', value: 5, color: '#f59e0b' },
];

export function AdminFinance() {
  const [period, setPeriod] = useState('month');

  // Fetch orders for revenue
  const { data: ordersData } = useQuery({
    queryKey: ['finance-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total, created_at, status, payment_status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      return data || [];
    }
  });

  // Fetch expenses
  const { data: expensesData } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('amount, category, expense_date')
        .gte('expense_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      return data || [];
    }
  });

  const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const stats = [
    {
      title: 'Ingresos del Mes',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Gastos del Mes',
      value: `$${totalExpenses.toLocaleString()}`,
      change: '+3.2%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Utilidad Neta',
      value: `$${netProfit.toLocaleString()}`,
      change: '+18.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Margen de Utilidad',
      value: `${profitMargin}%`,
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">Balance general y flujo de caja</p>
        </div>
        <div className="flex gap-2">
          <Button variant={period === 'week' ? 'default' : 'outline'} onClick={() => setPeriod('week')}>
            Semana
          </Button>
          <Button variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>
            Mes
          </Button>
          <Button variant={period === 'year' ? 'default' : 'outline'} onClick={() => setPeriod('year')}>
            Año
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="gap-1">
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorIngresos)"
                  name="Ingresos"
                />
                <Area 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorGastos)"
                  name="Gastos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Utilidad Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Utilidad']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="utilidad" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {expenseCategories.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {paymentMethods.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Registrar Ingreso
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Registrar Gasto
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Cerrar Período
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminFinance;
