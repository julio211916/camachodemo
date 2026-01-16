import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';

export function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Genera reportes del negocio</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Exportar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Ventas', icon: TrendingUp, desc: 'Reporte de ventas por período' },
          { title: 'Inventario', icon: BarChart3, desc: 'Stock y movimientos' },
          { title: 'Clientes', icon: FileText, desc: 'Cartera de clientes' },
          { title: 'Productos', icon: BarChart3, desc: 'Productos más vendidos' },
          { title: 'Financiero', icon: TrendingUp, desc: 'Balance y utilidades' },
          { title: 'Comisiones', icon: FileText, desc: 'Comisiones por vendedor' },
        ].map((report) => (
          <Card key={report.title} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-6">
              <report.icon className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminReports;
