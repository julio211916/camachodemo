import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
  unit?: string;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  distributor_price?: number;
  min_stock: number;
  max_stock?: number;
  reorder_point: number;
  current_stock: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
}

interface StockMovement {
  id: string;
  product_id: string;
  location_id?: string;
  movement_type: string;
  quantity: number;
  previous_quantity?: number;
  new_quantity?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  cost_per_unit?: number;
  created_by?: string;
  created_at: string;
  products?: { name: string; sku: string };
}

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  rfc?: string;
  notes?: string;
  is_active: boolean;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), brands(name), suppliers(name)')
        .order('name');
      
      if (error) throw error;
      return data as any[];
    }
  });

  const updateStock = useMutation({
    mutationFn: async ({ 
      productId, 
      quantity, 
      movementType, 
      notes 
    }: { 
      productId: string; 
      quantity: number; 
      movementType: string; 
      notes?: string;
    }) => {
      // Get current stock
      const { data: product } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      const previousStock = product?.current_stock || 0;
      let newStock = previousStock;

      if (movementType === 'entrada' || movementType === 'devolucion') {
        newStock = previousStock + quantity;
      } else if (movementType === 'salida' || movementType === 'venta') {
        newStock = previousStock - quantity;
      } else if (movementType === 'ajuste') {
        newStock = quantity; // Direct set
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: movementType,
          quantity: movementType === 'ajuste' ? quantity - previousStock : quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          notes
        });

      if (movementError) throw movementError;

      return { previousStock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      toast.success('Stock actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar stock: ' + error.message);
    }
  });

  const lowStockProducts = products.filter(
    p => p.current_stock <= p.min_stock
  );

  return {
    products,
    isLoading,
    error,
    updateStock,
    lowStockProducts
  };
}

export function useStockMovements(productId?: string) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StockMovement[];
    }
  });

  return { movements, isLoading };
}

export function useSuppliers() {
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    }
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor creado correctamente');
    }
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor actualizado');
    }
  });

  return { suppliers, isLoading, createSupplier, updateSupplier };
}

export function usePurchaseOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name), locations(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createOrder = useMutation({
    mutationFn: async (order: any) => {
      // Generate order number
      const orderNumber = `OC-${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({ ...order, order_number: orderNumber })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Orden de compra creada');
    }
  });

  const receiveOrder = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: any[] }) => {
      // Update each product stock
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', item.product_id)
          .single();

        const previousStock = product?.current_stock || 0;
        const newStock = previousStock + item.quantity_received;

        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', item.product_id);

        await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            movement_type: 'entrada',
            quantity: item.quantity_received,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: 'purchase_order',
            reference_id: orderId,
            cost_per_unit: item.unit_cost
          });
      }

      // Update order status
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'recibido', received_date: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      toast.success('Mercancía recibida correctamente');
    }
  });

  return { orders, isLoading, createOrder, receiveOrder };
}
