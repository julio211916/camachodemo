import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500', variant: 'secondary' as const },
  processing: { label: 'Procesando', color: 'bg-blue-500', variant: 'default' as const },
  shipped: { label: 'Enviado', color: 'bg-purple-500', variant: 'outline' as const },
  delivered: { label: 'Entregado', color: 'bg-green-500', variant: 'default' as const },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', variant: 'destructive' as const },
};

export function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total
          )
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  const filteredOrders = orders?.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => o.status === 'processing').length || 0,
    shipped: orders?.filter(o => o.status === 'shipped').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gestiona todos los pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('processing')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
            <p className="text-xs text-muted-foreground">Procesando</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('shipped')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{stats.shipped}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('delivered')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Entregados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviados</SelectItem>
                <SelectItem value="delivered">Entregados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium">Pedido</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Pago</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : filteredOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No se encontraron pedidos
                    </td>
                  </tr>
                ) : (
                  filteredOrders?.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.order_items?.length || 0} productos
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{order.customer_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, status: value })}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <Badge variant={statusConfig[order.status as keyof typeof statusConfig]?.variant || 'secondary'}>
                              {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {order.payment_status === 'paid' ? 'Pagado' : 
                           order.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        ${order.total?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'shipped' })}
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm">{selectedOrder.customer_email}</p>
                  <p className="text-sm">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Envío</p>
                  <p className="text-sm">{selectedOrder.shipping_address}</p>
                  <p className="text-sm">{selectedOrder.shipping_city}, {selectedOrder.shipping_state}</p>
                  <p className="text-sm">CP: {selectedOrder.shipping_postal_code}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Productos</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.unit_price}
                        </p>
                      </div>
                      <p className="font-medium">${item.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <Badge variant={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.variant}>
                    {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">${selectedOrder.total?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminOrders;
