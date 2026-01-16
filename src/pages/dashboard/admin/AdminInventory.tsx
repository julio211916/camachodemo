import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Plus,
  Minus,
  Edit,
  History,
  ArrowUpDown,
  Download,
  Upload
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
import { Textarea } from '@/components/ui/textarea';
import { useProducts, useStockMovements } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminInventory() {
  const { products, isLoading, updateStock, lowStockProducts } = useProducts();
  const { movements } = useStockMovements();
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    product?: any;
    type: 'entrada' | 'salida' | 'ajuste';
  }>({ open: false, type: 'entrada' });
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    productId?: string;
    productName?: string;
  }>({ open: false });

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    
    if (stockFilter === 'low') {
      return matchesSearch && p.current_stock <= p.min_stock && p.current_stock > 0;
    }
    if (stockFilter === 'out') {
      return matchesSearch && p.current_stock <= 0;
    }
    return matchesSearch;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);
  const totalItems = products.reduce((sum, p) => sum + p.current_stock, 0);
  const outOfStock = products.filter(p => p.current_stock <= 0).length;

  const handleAdjust = async () => {
    if (!adjustDialog.product || !adjustQuantity) return;

    await updateStock.mutateAsync({
      productId: adjustDialog.product.id,
      quantity: parseInt(adjustQuantity),
      movementType: adjustDialog.type,
      notes: adjustNotes
    });

    setAdjustDialog({ open: false, type: 'entrada' });
    setAdjustQuantity('');
    setAdjustNotes('');
  };

  const getStockBadge = (product: any) => {
    if (product.current_stock <= 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    }
    if (product.current_stock <= product.min_stock) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Stock Bajo</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-500/20 text-green-600">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Gestión de stock y movimientos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades en Stock</p>
                <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={outOfStock > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
                <p className="text-2xl font-bold text-red-500">{outOfStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              Productos con Stock Bajo ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 10).map(p => (
                <Badge key={p.id} variant="outline" className="text-yellow-600">
                  {p.name} ({p.current_stock})
                </Badge>
              ))}
              {lowStockProducts.length > 10 && (
                <Badge variant="outline">+{lowStockProducts.length - 10} más</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="low">Stock Bajo</SelectItem>
            <SelectItem value="out">Sin Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Stock Actual</TableHead>
                <TableHead className="text-center">Mínimo</TableHead>
                <TableHead className="text-center">Reorden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${product.current_stock <= 0 ? 'text-red-500' : product.current_stock <= product.min_stock ? 'text-yellow-500' : ''}`}>
                        {product.current_stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {product.min_stock}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {product.reorder_point}
                    </TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell className="text-right">
                      ${(product.current_stock * product.cost_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setAdjustDialog({ open: true, product, type: 'entrada' })}
                        >
                          <Plus className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setAdjustDialog({ open: true, product, type: 'salida' })}
                        >
                          <Minus className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setAdjustDialog({ open: true, product, type: 'ajuste' })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setHistoryDialog({ open: true, productId: product.id, productName: product.name })}
                        >
                          <History className="w-4 h-4" />
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

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustDialog.type === 'entrada' && 'Entrada de Stock'}
              {adjustDialog.type === 'salida' && 'Salida de Stock'}
              {adjustDialog.type === 'ajuste' && 'Ajuste de Stock'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Producto</p>
              <p className="font-medium">{adjustDialog.product?.name}</p>
              <p className="text-sm">Stock actual: <strong>{adjustDialog.product?.current_stock}</strong></p>
            </div>

            <div>
              <label className="text-sm font-medium">
                {adjustDialog.type === 'ajuste' ? 'Nuevo Stock' : 'Cantidad'}
              </label>
              <Input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder={adjustDialog.type === 'ajuste' ? 'Nuevo valor' : 'Cantidad'}
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Motivo del ajuste..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, type: 'entrada' })}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={!adjustQuantity || updateStock.isPending}>
              {updateStock.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <StockHistoryDialog 
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false })}
        productId={historyDialog.productId}
        productName={historyDialog.productName}
      />
    </div>
  );
}

function StockHistoryDialog({ 
  open, 
  onClose, 
  productId, 
  productName 
}: { 
  open: boolean; 
  onClose: () => void; 
  productId?: string; 
  productName?: string;
}) {
  const { movements, isLoading } = useStockMovements(productId);

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'entrada':
        return <Badge className="bg-green-500">Entrada</Badge>;
      case 'salida':
        return <Badge className="bg-red-500">Salida</Badge>;
      case 'venta':
        return <Badge className="bg-blue-500">Venta</Badge>;
      case 'devolucion':
        return <Badge className="bg-yellow-500">Devolución</Badge>;
      case 'ajuste':
        return <Badge variant="outline">Ajuste</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos - {productName}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock Anterior</TableHead>
                <TableHead className="text-right">Stock Nuevo</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Sin movimientos</TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">
                      {format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>{getMovementBadge(m.movement_type)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={m.quantity > 0 ? 'text-green-500' : 'text-red-500'}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{m.previous_quantity || 0}</TableCell>
                    <TableCell className="text-right font-medium">{m.new_quantity || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {m.notes}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
