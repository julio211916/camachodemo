import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function CustomerAddresses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Direcciones</h1>
        <Button><Plus className="w-4 h-4 mr-2" />Agregar Dirección</Button>
      </div>
      <Card><CardContent className="p-6 text-center text-muted-foreground">No tienes direcciones guardadas.</CardContent></Card>
    </div>
  );
}
export default CustomerAddresses;
