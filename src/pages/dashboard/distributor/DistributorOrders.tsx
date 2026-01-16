import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function DistributorOrders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Pedidos</h1>
        <Button><Plus className="w-4 h-4 mr-2" />Nuevo Pedido</Button>
      </div>
      <Card><CardContent className="p-6 text-center text-muted-foreground">No tienes pedidos activos.</CardContent></Card>
    </div>
  );
}
export default DistributorOrders;
