import { useState } from 'react';
import { 
  FileText,
  Plus,
  Eye,
  Check,
  X,
  Search,
  Truck,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePurchaseOrders, useSuppliers, useProducts } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  unit_cost: number;
  total: number;
}

export default function AdminPurchaseOrders() {
  const { orders, isLoading, createOrder, receiveOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState<{
    open: boolean;
    order?: any;
  }>({ open: false });

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.suppliers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      borrador: 'bg-gray-500',
      enviado: 'bg-blue-500',
      confirmado: 'bg-yellow-500',
      parcial: 'bg-orange-500',
      recibido: 'bg-green-500',
      cancelado: 'bg-red-500'
    };
    return <Badge className={styles[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  const addItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product || !quantity || !unitCost) return;

    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      quantity_ordered: parseInt(quantity),
      unit_cost: parseFloat(unitCost),
      total: parseInt(quantity) * parseFloat(unitCost)
    }]);

    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    
    await createOrder.mutateAsync({
      supplier_id: supplierId,
      expected_date: expectedDate || null,
      notes,
      subtotal,
      tax_amount: tax,
      total: subtotal + tax,
      status: 'borrador'
    });

    // Reset form
    setSupplierId('');
    setExpectedDate('');
    setNotes('');
    setItems([]);
    setCreateDialogOpen(false);
  };

  const handleReceive = async () => {
    if (!receiveDialogOpen.order) return;

    // For simplicity, receive all items in full
    const itemsToReceive = receiveDialogOpen.order.items?.map((item: any) => ({
      product_id: item.product_id,
      quantity_received: item.quantity_ordered,
      unit_cost: item.unit_cost
    })) || [];

    await receiveOrder.mutateAsync({
      orderId: receiveDialogOpen.order.id,
      items: itemsToReceive
    });

    setReceiveDialogOpen({ open: false });
  };

  const orderTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona las compras a proveedores</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Órdenes</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['borrador', 'enviado', 'confirmado'].includes(o.status)).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Recibir</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'confirmado').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recibidas (mes)</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'recibido').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número o proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Entrega Esperada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No hay órdenes de compra
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>{order.suppliers?.name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {order.expected_date 
                        ? format(new Date(order.expected_date), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${order.total?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {order.status === 'confirmado' && (
                          <Button
                            size="sm"
                            onClick={() => setReceiveDialogOpen({ open: true, order })}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Recibir
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Proveedor *</label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Entrega Esperada</label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Add Product */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Agregar Productos</h4>
              <div className="grid grid-cols-4 gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Costo Unit."
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  step="0.01"
                />
                <Button onClick={addItem} disabled={!selectedProduct || !quantity || !unitCost}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                        <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => removeItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Totals */}
            <div className="text-right space-y-1">
              <p>Subtotal: <span className="font-medium">${orderTotal.toFixed(2)}</span></p>
              <p>IVA (16%): <span className="font-medium">${(orderTotal * 0.16).toFixed(2)}</span></p>
              <p className="text-lg font-bold">
                Total: ${(orderTotal * 1.16).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!supplierId || items.length === 0 || createOrder.isPending}
            >
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Order Dialog */}
      <Dialog open={receiveDialogOpen.open} onOpenChange={(open) => setReceiveDialogOpen({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recibir Mercancía</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              ¿Confirmar recepción de la orden <strong>{receiveDialogOpen.order?.order_number}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              El stock de los productos será actualizado automáticamente.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleReceive} disabled={receiveOrder.isPending}>
              <Check className="w-4 h-4 mr-2" />
              Confirmar Recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
