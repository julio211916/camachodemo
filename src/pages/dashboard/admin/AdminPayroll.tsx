import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Calculator
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AdminPayroll() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  const { data: employees } = useQuery({
    queryKey: ['payroll-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const { data: commissions } = useQuery({
    queryKey: ['payroll-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    }
  });

  const totalBaseSalary = employees?.reduce((sum, e) => sum + (e.base_salary || 0), 0) || 0;
  const totalCommissions = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const totalPayroll = totalBaseSalary + totalCommissions;

  const payrollByEmployee = employees?.map(emp => {
    const empCommissions = commissions?.filter(c => c.employee_id === emp.id) || [];
    const totalCommission = empCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    return {
      ...emp,
      commissions: totalCommission,
      total: (emp.base_salary || 0) + totalCommission,
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nómina</h1>
          <p className="text-muted-foreground">Gestión de pagos y comisiones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Período
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Empleados Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalBaseSalary.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Salarios Base</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalCommissions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Comisiones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Nómina</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Período:</span>
            <div className="flex gap-2">
              <Button 
                variant={selectedPeriod === 'current' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('current')}
              >
                Actual (Ene 1-15)
              </Button>
              <Button 
                variant={selectedPeriod === 'previous' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('previous')}
              >
                Anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Nómina</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium">Empleado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Puesto</th>
                  <th className="text-right py-3 px-4 text-xs font-medium">Salario Base</th>
                  <th className="text-right py-3 px-4 text-xs font-medium">Comisiones</th>
                  <th className="text-right py-3 px-4 text-xs font-medium">Deducciones</th>
                  <th className="text-right py-3 px-4 text-xs font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-xs font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {payrollByEmployee.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">
                            {employee.full_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{employee.position || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      ${(employee.base_salary || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-green-600">
                      +${employee.commissions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-600">
                      -$0
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold">
                      ${employee.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </Badge>
                    </td>
                  </tr>
                ))}
                {payrollByEmployee.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay empleados para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-bold">
                  <td colSpan={2} className="py-3 px-4 text-sm">TOTALES</td>
                  <td className="py-3 px-4 text-sm text-right">${totalBaseSalary.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">+${totalCommissions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-red-600">-$0</td>
                  <td className="py-3 px-4 text-sm text-right">${totalPayroll.toLocaleString()}</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">
          Guardar Borrador
        </Button>
        <Button>
          <CheckCircle className="w-4 h-4 mr-2" />
          Procesar Nómina
        </Button>
      </div>
    </div>
  );
}

export default AdminPayroll;
