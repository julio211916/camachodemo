import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Package, DollarSign, TrendingUp } from 'lucide-react';

export function DistributorHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Portal de Distribuidor</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 text-center"><ShoppingCart className="w-8 h-8 mx-auto mb-2 text-primary" /><p className="font-semibold">5</p><p className="text-sm text-muted-foreground">Pedidos Pendientes</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-green-500" /><p className="font-semibold">48</p><p className="text-sm text-muted-foreground">Pedidos Entregados</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-500" /><p className="font-semibold">$45,200</p><p className="text-sm text-muted-foreground">Ventas del Mes</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-500" /><p className="font-semibold">+12%</p><p className="text-sm text-muted-foreground">Crecimiento</p></CardContent></Card>
      </div>
    </div>
  );
}
export default DistributorHome;
