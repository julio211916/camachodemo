import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employee_code: string | null;
  position: string | null;
  location_id: string | null;
  base_salary: number | null;
  commission_rate: number | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminEmployees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Employee[];
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await supabase.from('locations').select('id, name');
      return data || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', employee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success('Empleado actualizado');
      setIsDialogOpen(false);
      setEditingEmployee(null);
    },
    onError: () => toast.error('Error al actualizar empleado')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success('Empleado eliminado');
    },
    onError: () => toast.error('Error al eliminar empleado')
  });

  const filteredEmployees = employees?.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: employees?.length || 0,
    active: employees?.filter(e => e.is_active).length || 0,
    totalPayroll: employees?.reduce((sum, e) => sum + (e.base_salary || 0), 0) || 0,
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingEmployee?.id) {
      updateMutation.mutate(editingEmployee);
    }
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'Sin asignar';
    return locations?.find(l => l.id === locationId)?.name || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">Gestiona tu equipo de trabajo</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Empleados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.totalPayroll.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Nómina Mensual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium">Empleado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Puesto</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Sucursal</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Salario</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Comisión</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Cargando empleados...
                    </td>
                  </tr>
                ) : filteredEmployees?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No se encontraron empleados
                    </td>
                  </tr>
                ) : (
                  filteredEmployees?.map((employee) => (
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
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{employee.position || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{getLocationName(employee.location_id)}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        ${employee.base_salary?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {employee.commission_rate ? `${(employee.commission_rate * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(employee)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('¿Eliminar este empleado?')) {
                                deleteMutation.mutate(employee.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
          </DialogHeader>
          
          {editingEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre Completo</Label>
                <Input
                  value={editingEmployee.full_name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingEmployee.email || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editingEmployee.phone || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Código de Empleado</Label>
                <Input
                  value={editingEmployee.employee_code || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employee_code: e.target.value })}
                />
              </div>
              <div>
                <Label>Puesto</Label>
                <Input
                  value={editingEmployee.position || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                />
              </div>
              <div>
                <Label>Sucursal</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={editingEmployee.location_id || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, location_id: e.target.value || null })}
                >
                  <option value="">Sin asignar</option>
                  {locations?.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fecha de Ingreso</Label>
                <Input
                  type="date"
                  value={editingEmployee.hire_date || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, hire_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Salario Base</Label>
                <Input
                  type="number"
                  value={editingEmployee.base_salary || 0}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, base_salary: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Tasa de Comisión (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(editingEmployee.commission_rate || 0) * 100}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, commission_rate: parseFloat(e.target.value) / 100 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingEmployee.is_active}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Empleado Activo</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEmployees;
