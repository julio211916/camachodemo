import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  ShoppingCart,
  Users,
  MapPin,
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  Route,
} from 'lucide-react';

export default function VendorHome() {
  const { profile } = useAuth();

  const stats = [
    { title: 'Ventas Hoy', value: '$4,250', icon: DollarSign, trend: '+12%', trendUp: true },
    { title: 'Pedidos Hoy', value: '8', icon: ShoppingCart, trend: '+3', trendUp: true },
    { title: 'Clientes Visitados', value: '5/12', icon: Users, trend: '42%', trendUp: false },
    { title: 'Stock Disponible', value: '156', icon: Package, trend: 'OK', trendUp: true },
  ];

  const todayClients = [
    { name: 'Farmacia San Miguel', address: 'Av. Central 123', time: '09:00', status: 'pending' },
    { name: 'Farmacia del Centro', address: 'Calle 5 de Mayo 45', time: '10:30', status: 'visited' },
    { name: 'Farmacia Popular', address: 'Blvd. Hidalgo 789', time: '12:00', status: 'visited' },
    { name: 'Farmacia La Salud', address: 'Av. Juárez 234', time: '14:00', status: 'pending' },
  ];

  const recentSales = [
    { client: 'Farmacia del Centro', amount: '$1,250', items: 15, time: '10:45' },
    { client: 'Farmacia Popular', amount: '$890', items: 8, time: '12:30' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">¡Hola, {profile?.full_name?.split(' ')[0]}!</h1>
        <p className="text-green-100 mt-1">Tu ruta de hoy: 12 clientes programados</p>
        <div className="flex gap-3 mt-4">
          <Button className="bg-white text-green-700 hover:bg-green-50">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button variant="outline" className="border-white text-white hover:bg-white/20">
            <Route className="w-4 h-4 mr-2" />
            Ver Ruta
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.trendUp ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <stat.icon className={`w-5 h-5 ${stat.trendUp ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`w-3 h-3 ${stat.trendUp ? 'text-green-500' : 'text-amber-500'}`} />
                <span className={`text-xs ${stat.trendUp ? 'text-green-500' : 'text-amber-500'}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Clientes de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClients.map((client, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  client.status === 'visited' ? 'bg-green-50 border-green-200' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    client.status === 'visited' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={client.status === 'visited' ? 'default' : 'outline'}>
                    {client.time}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Ventas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSales.map((sale, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{sale.client}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sale.time} · {sale.items} productos
                  </p>
                </div>
                <p className="font-bold text-green-600">{sale.amount}</p>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-4">
              Ver Todas las Ventas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
