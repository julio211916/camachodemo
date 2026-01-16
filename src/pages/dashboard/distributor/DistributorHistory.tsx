import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function DistributorHistory() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Historial de Pedidos</h1>
      <Card><CardContent className="p-6 text-center text-muted-foreground">No hay historial de pedidos.</CardContent></Card>
    </div>
  );
}
export default DistributorHistory;
