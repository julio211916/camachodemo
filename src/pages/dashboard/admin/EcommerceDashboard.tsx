import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Sample data for charts
const salesData = [
  { name: 'Ene', ventas: 45000, pedidos: 120 },
  { name: 'Feb', ventas: 52000, pedidos: 145 },
  { name: 'Mar', ventas: 48000, pedidos: 132 },
  { name: 'Abr', ventas: 61000, pedidos: 178 },
  { name: 'May', ventas: 55000, pedidos: 156 },
  { name: 'Jun', ventas: 67000, pedidos: 198 },
  { name: 'Jul', ventas: 72000, pedidos: 215 },
];

const topProducts = [
  { name: 'Jarabe Ajolotius 250ml', ventas: 450, ingresos: 11925 },
  { name: 'Jarabe Broncoplus 250ml', ventas: 380, ingresos: 10070 },
  { name: 'Aceite de Coco LT', ventas: 320, ingresos: 25792 },
  { name: 'Loción 7M LT', ventas: 280, ingresos: 11088 },
  { name: 'Pomada de Sábila', ventas: 250, ingresos: 8750 },
];

const ordersByStatus = [
  { name: 'Pendientes', value: 12, color: '#f59e0b' },
  { name: 'En Proceso', value: 8, color: '#3b82f6' },
  { name: 'Enviados', value: 15, color: '#8b5cf6' },
  { name: 'Entregados', value: 45, color: '#22c55e' },
];

export function EcommerceDashboard() {
  // Fetch orders count
  const { data: ordersData } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      return { todayOrders: todayOrders || 0, pendingOrders: pendingOrders || 0 };
    }
  });

  // Fetch clients count
  const { data: clientsData } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return count || 0;
    }
  });

  // Fetch products with low stock
  const { data: lowStockProducts } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, current_stock, min_stock')
        .lt('current_stock', 10)
        .eq('is_active', true)
        .limit(5);
      return data || [];
    }
  });

  // Fetch recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const stats = [
    {
      title: 'Ventas del Mes',
      value: '$72,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pedidos Hoy',
      value: ordersData?.todayOrders || 0,
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Clientes Activos',
      value: clientsData || 0,
      change: '+5.1%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Productos Activos',
      value: 165,
      change: '+3',
      trend: 'up',
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu negocio</p>
        </div>
        <Button>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
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
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {ordersByStatus.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos Más Vendidos</CardTitle>
            <Button variant="ghost" size="sm">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.ventas} unidades</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">${product.ingresos.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low Stock Alert */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-sm">Stock Bajo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {lowStockProducts?.length || 0} productos con stock bajo
              </p>
            </div>

            {/* Pending Orders */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Pedidos Pendientes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ordersData?.pendingOrders || 0} pedidos por procesar
              </p>
            </div>

            {/* Shipments */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">Envíos en Tránsito</span>
              </div>
              <p className="text-xs text-muted-foreground">
                15 envíos en camino
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recientes</CardTitle>
          <Button variant="ghost" size="sm">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Pedido</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm font-medium">{order.order_number}</td>
                    <td className="py-3 px-4 text-sm">{order.customer_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        'outline'
                      }>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'processing' ? 'Procesando' :
                         order.status === 'shipped' ? 'Enviado' :
                         order.status === 'delivered' ? 'Entregado' : order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">${order.total?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay pedidos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EcommerceDashboard;
