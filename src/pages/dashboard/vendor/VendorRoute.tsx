import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Navigation,
  Phone,
  ShoppingCart,
} from 'lucide-react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function VendorRoute() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay().toString());

  const todayStops = [
    {
      id: '1',
      order: 1,
      name: 'Farmacia San Miguel',
      address: 'Av. Central 123, Col. Centro',
      phone: '555-1234',
      time: '09:00',
      status: 'visited',
      lastPurchase: '$2,450',
    },
    {
      id: '2',
      order: 2,
      name: 'Farmacia del Centro',
      address: 'Calle 5 de Mayo 45',
      phone: '555-5678',
      time: '10:30',
      status: 'visited',
      lastPurchase: '$1,890',
    },
    {
      id: '3',
      order: 3,
      name: 'Farmacia Popular',
      address: 'Blvd. Hidalgo 789',
      phone: '555-9012',
      time: '12:00',
      status: 'current',
      lastPurchase: '$3,200',
    },
    {
      id: '4',
      order: 4,
      name: 'Farmacia La Salud',
      address: 'Av. Juárez 234',
      phone: '555-3456',
      time: '14:00',
      status: 'pending',
      lastPurchase: '$1,500',
    },
    {
      id: '5',
      order: 5,
      name: 'Farmacia Económica',
      address: 'Calle Morelos 567',
      phone: '555-7890',
      time: '15:30',
      status: 'pending',
      lastPurchase: '$980',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'visited':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Navigation className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'visited':
        return 'bg-green-50 border-green-200';
      case 'current':
        return 'bg-blue-50 border-blue-200 ring-2 ring-blue-500';
      default:
        return 'bg-card';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi Ruta</h1>
          <p className="text-muted-foreground">Clientes programados por día</p>
        </div>
        <Button variant="outline">
          <Navigation className="w-4 h-4 mr-2" />
          Iniciar Navegación
        </Button>
      </div>

      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList className="grid grid-cols-7">
          {DAYS.map((day, idx) => (
            <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
              {day.substring(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedDay} className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Paradas de {DAYS[parseInt(selectedDay)]}
                </span>
                <Badge variant="secondary">{todayStops.length} clientes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayStops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className={`p-4 rounded-lg border transition-all ${getStatusBg(stop.status)}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Order & Status */}
                    <div className="flex flex-col items-center gap-1">
                      {getStatusIcon(stop.status)}
                      <span className="text-xs font-bold text-muted-foreground">
                        #{stop.order}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{stop.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {stop.address}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {stop.time}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-muted-foreground">
                          Última compra: <span className="font-medium text-foreground">{stop.lastPurchase}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="w-3 h-3 mr-1" />
                            Llamar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Navigation className="w-3 h-3 mr-1" />
                            Ir
                          </Button>
                          <Button size="sm">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Vender
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline connector */}
                  {idx < todayStops.length - 1 && (
                    <div className="ml-2.5 mt-2 h-6 w-px bg-border" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
