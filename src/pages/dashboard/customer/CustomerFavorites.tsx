import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function CustomerFavorites() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mis Favoritos</h1>
      <Card><CardContent className="p-6 text-center text-muted-foreground">No tienes productos favoritos aún.</CardContent></Card>
    </div>
  );
}
export default CustomerFavorites;
