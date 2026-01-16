import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export function DistributorAI() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asistente IA</h1>
      <Card><CardContent className="p-6 text-center"><Brain className="w-12 h-12 mx-auto mb-4 text-primary" /><p className="text-muted-foreground">El asistente de IA te ayudará con recomendaciones de productos y análisis de ventas.</p></CardContent></Card>
    </div>
  );
}
export default DistributorAI;
