import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DollarSign
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  rfc: string | null;
  client_type: string | null;
  credit_limit: number | null;
  current_balance: number | null;
  discount_percentage: number | null;
  loyalty_points: number | null;
  is_active: boolean;
  created_at: string;
}

const emptyClient: Partial<Client> = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  rfc: '',
  client_type: 'retail',
  credit_limit: 0,
  discount_percentage: 0,
  is_active: true,
};

export function AdminClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Client[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { error } = await supabase.from('clients').insert([{
        full_name: client.full_name!,
        email: client.email!,
        phone: client.phone,
        address: client.address,
        city: client.city,
        state: client.state,
        postal_code: client.postal_code,
        rfc: client.rfc,
        client_type: client.client_type,
        credit_limit: client.credit_limit,
        discount_percentage: client.discount_percentage,
        is_active: client.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente creado');
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: () => toast.error('Error al crear cliente')
  });

  const updateMutation = useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente actualizado');
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: () => toast.error('Error al actualizar cliente')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente eliminado');
    },
    onError: () => toast.error('Error al eliminar cliente')
  });

  const filteredClients = clients?.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleSave = () => {
    if (!editingClient?.full_name || !editingClient?.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    if (editingClient.id) {
      updateMutation.mutate(editingClient);
    } else {
      createMutation.mutate(editingClient);
    }
  };

  const openCreate = () => {
    setEditingClient({ ...emptyClient });
    setIsDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient({ ...client });
    setIsDialogOpen(true);
  };

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter(c => c.is_active).length || 0,
    retail: clients?.filter(c => c.client_type === 'retail').length || 0,
    wholesale: clients?.filter(c => c.client_type === 'wholesale').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Clientes</p>
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
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.retail}</p>
              <p className="text-xs text-muted-foreground">Minoristas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.wholesale}</p>
              <p className="text-xs text-muted-foreground">Mayoristas</p>
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
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Cargando clientes...
          </div>
        ) : filteredClients?.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No se encontraron clientes
          </div>
        ) : (
          filteredClients?.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {client.full_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{client.full_name}</p>
                      <Badge variant={client.client_type === 'wholesale' ? 'default' : 'secondary'}>
                        {client.client_type === 'wholesale' ? 'Mayorista' : 'Minorista'}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{client.city}, {client.state}</span>
                    </div>
                  )}
                  {client.credit_limit && client.credit_limit > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>Crédito: ${client.credit_limit.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('¿Eliminar este cliente?')) {
                        deleteMutation.mutate(client.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
          
          {editingClient && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={editingClient.full_name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, full_name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editingClient.email || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editingClient.phone || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  placeholder="55 1234 5678"
                />
              </div>
              <div>
                <Label>RFC</Label>
                <Input
                  value={editingClient.rfc || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, rfc: e.target.value })}
                  placeholder="RFC"
                />
              </div>
              <div>
                <Label>Tipo de Cliente</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={editingClient.client_type || 'retail'}
                  onChange={(e) => setEditingClient({ ...editingClient, client_type: e.target.value })}
                >
                  <option value="retail">Minorista</option>
                  <option value="wholesale">Mayorista</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  placeholder="Calle y número"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editingClient.city || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={editingClient.state || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, state: e.target.value })}
                  placeholder="Estado"
                />
              </div>
              <div>
                <Label>Código Postal</Label>
                <Input
                  value={editingClient.postal_code || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, postal_code: e.target.value })}
                  placeholder="C.P."
                />
              </div>
              <div>
                <Label>Límite de Crédito</Label>
                <Input
                  type="number"
                  value={editingClient.credit_limit || 0}
                  onChange={(e) => setEditingClient({ ...editingClient, credit_limit: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  value={editingClient.discount_percentage || 0}
                  onChange={(e) => setEditingClient({ ...editingClient, discount_percentage: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingClient.is_active}
                  onChange={(e) => setEditingClient({ ...editingClient, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Cliente Activo</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingClient?.id ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminClients;
