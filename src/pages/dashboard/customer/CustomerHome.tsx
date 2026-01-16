import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Heart, DollarSign } from 'lucide-react';

export function CustomerHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">¡Bienvenido!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 text-center"><ShoppingCart className="w-8 h-8 mx-auto mb-2 text-primary" /><p className="font-semibold">3</p><p className="text-sm text-muted-foreground">Pedidos Activos</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-green-500" /><p className="font-semibold">12</p><p className="text-sm text-muted-foreground">Pedidos Entregados</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><Heart className="w-8 h-8 mx-auto mb-2 text-red-500" /><p className="font-semibold">8</p><p className="text-sm text-muted-foreground">Favoritos</p></CardContent></Card>
        <Card><CardContent className="p-6 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-500" /><p className="font-semibold">$2,450</p><p className="text-sm text-muted-foreground">Total Compras</p></CardContent></Card>
      </div>
      <Button>Ver Catálogo de Productos</Button>
    </div>
  );
}
export default CustomerHome;
