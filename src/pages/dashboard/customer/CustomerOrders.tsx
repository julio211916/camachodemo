import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CustomerOrders() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mis Pedidos</h1>
      <Card><CardContent className="p-6 text-center text-muted-foreground">No tienes pedidos aún. ¡Explora nuestro catálogo!</CardContent></Card>
    </div>
  );
}
export default CustomerOrders;
