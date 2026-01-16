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
  Truck,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Building2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Distributor {
  id: string;
  user_id: string;
  business_name: string;
  legal_name: string | null;
  email: string;
  phone: string | null;
  contact_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  rfc: string | null;
  zone: string | null;
  credit_limit: number | null;
  current_balance: number | null;
  discount_percentage: number | null;
  is_active: boolean;
  approved_at: string | null;
  created_at: string;
}

export function AdminDistributors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Partial<Distributor> | null>(null);
  const queryClient = useQueryClient();

  const { data: distributors, isLoading } = useQuery({
    queryKey: ['admin-distributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('business_name');
      if (error) throw error;
      return data as Distributor[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (distributor: Partial<Distributor>) => {
      const { error } = await supabase
        .from('distributors')
        .update(distributor)
        .eq('id', distributor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      toast.success('Distribuidor actualizado');
      setIsDialogOpen(false);
      setEditingDistributor(null);
    },
    onError: () => toast.error('Error al actualizar distribuidor')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('distributors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      toast.success('Distribuidor eliminado');
    },
    onError: () => toast.error('Error al eliminar distribuidor')
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('distributors')
        .update({ 
          is_active: true, 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      toast.success('Distribuidor aprobado');
    },
    onError: () => toast.error('Error al aprobar distribuidor')
  });

  const filteredDistributors = distributors?.filter(d =>
    d.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: distributors?.length || 0,
    active: distributors?.filter(d => d.is_active).length || 0,
    pending: distributors?.filter(d => !d.approved_at).length || 0,
    totalCredit: distributors?.reduce((sum, d) => sum + (d.credit_limit || 0), 0) || 0,
  };

  const openEdit = (distributor: Distributor) => {
    setEditingDistributor({ ...distributor });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingDistributor?.id) {
      updateMutation.mutate(editingDistributor);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Distribuidores</h1>
          <p className="text-muted-foreground">Gestiona tu red de distribuidores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Truck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Truck className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${(stats.totalCredit / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">Crédito Total</p>
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
              placeholder="Buscar por nombre, email o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distributors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Cargando distribuidores...
          </div>
        ) : filteredDistributors?.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No se encontraron distribuidores
          </div>
        ) : (
          filteredDistributors?.map((distributor) => (
            <Card key={distributor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{distributor.business_name}</p>
                      {distributor.zone && (
                        <Badge variant="outline">{distributor.zone}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={distributor.is_active ? 'default' : 'secondary'}>
                      {distributor.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {!distributor.approved_at && (
                      <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {distributor.contact_name && (
                    <p className="text-muted-foreground">
                      Contacto: {distributor.contact_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{distributor.email}</span>
                  </div>
                  {distributor.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{distributor.phone}</span>
                    </div>
                  )}
                  {distributor.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{distributor.city}, {distributor.state}</span>
                    </div>
                  )}
                  {distributor.credit_limit && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>Crédito: ${distributor.credit_limit.toLocaleString()}</span>
                    </div>
                  )}
                  {distributor.discount_percentage && (
                    <p className="text-green-600">
                      Descuento: {distributor.discount_percentage}%
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  {!distributor.approved_at && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => approveMutation.mutate(distributor.id)}
                    >
                      Aprobar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(distributor)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('¿Eliminar este distribuidor?')) {
                        deleteMutation.mutate(distributor.id);
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

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Distribuidor</DialogTitle>
          </DialogHeader>
          
          {editingDistributor && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre Comercial</Label>
                <Input
                  value={editingDistributor.business_name || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, business_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Razón Social</Label>
                <Input
                  value={editingDistributor.legal_name || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, legal_name: e.target.value })}
                />
              </div>
              <div>
                <Label>RFC</Label>
                <Input
                  value={editingDistributor.rfc || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, rfc: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingDistributor.email || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editingDistributor.phone || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Nombre de Contacto</Label>
                <Input
                  value={editingDistributor.contact_name || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Zona</Label>
                <Input
                  value={editingDistributor.zone || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, zone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={editingDistributor.address || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editingDistributor.city || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={editingDistributor.state || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Límite de Crédito</Label>
                <Input
                  type="number"
                  value={editingDistributor.credit_limit || 0}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, credit_limit: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  value={editingDistributor.discount_percentage || 0}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, discount_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingDistributor.is_active}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Distribuidor Activo</Label>
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

export default AdminDistributors;
