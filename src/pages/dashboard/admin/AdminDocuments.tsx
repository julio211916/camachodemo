import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Plus, QrCode } from 'lucide-react';

export function AdminDocuments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Notas de remisión y tickets</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Notas de Remisión</h3>
            <p className="text-sm text-muted-foreground">Generar notas para pedidos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-6 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Tickets con QR</h3>
            <p className="text-sm text-muted-foreground">Tickets de venta con código QR</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-6 text-center">
            <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Exportar</h3>
            <p className="text-sm text-muted-foreground">Descargar documentos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDocuments;
