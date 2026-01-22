import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Package,
  AlertTriangle,
  ArrowUpCircle,
  Truck,
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  retail_price: number;
  image_url?: string;
}

export default function VendorStock() {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, current_stock, min_stock, retail_price, image_url')
      .eq('is_active', true)
      .order('current_stock', { ascending: true })
      .limit(100);

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const getStockStatus = (current: number, min: number) => {
    const ratio = current / (min || 1);
    if (ratio <= 0.5) return { color: 'text-red-500', bg: 'bg-red-100', label: 'Crítico' };
    if (ratio <= 1) return { color: 'text-amber-500', bg: 'bg-amber-100', label: 'Bajo' };
    return { color: 'text-green-500', bg: 'bg-green-100', label: 'OK' };
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter((p) => p.current_stock <= (p.min_stock || 5)).length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * (p.retail_price || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi Inventario</h1>
          <p className="text-muted-foreground">Stock asignado a tu unidad</p>
        </div>
        <Button>
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Solicitar Reabasto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.current_stock, product.min_stock || 5);
                const stockPercent = Math.min(100, (product.current_stock / (product.min_stock * 2 || 10)) * 100);

                return (
                  <div key={product.id} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>

                    <div className="w-32">
                      <Progress value={stockPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.current_stock} / {product.min_stock * 2 || 10} unidades
                      </p>
                    </div>

                    <Badge className={status.bg}>
                      <span className={status.color}>{status.label}</span>
                    </Badge>

                    <p className="font-bold w-20 text-right">${product.retail_price?.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
