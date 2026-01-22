-- First add vendor role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- =============================================
-- EXTENDED ERP SCHEMA FOR PRODUCTOS CAMACHO
-- =============================================

-- Vendors table (salespersons)
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  employee_number TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Warehouses for multi-location inventory
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  location_id UUID REFERENCES public.locations(id),
  warehouse_type TEXT DEFAULT 'physical' CHECK (warehouse_type IN ('physical', 'virtual', 'mobile')),
  address TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Warehouses (stock per warehouse)
CREATE TABLE IF NOT EXISTS public.product_warehouse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  last_movement_at TIMESTAMPTZ,
  UNIQUE(product_id, warehouse_id)
);

-- Distributor Orders (B2B orders from distributors to lab)
CREATE TABLE IF NOT EXISTS public.distributor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  distributor_id UUID NOT NULL REFERENCES public.distributors(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Distributor Order Items
CREATE TABLE IF NOT EXISTS public.distributor_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.distributor_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendors table needs to be created first
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  employee_number TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Physical Sales Orders (field sales by vendors)
CREATE TABLE IF NOT EXISTS public.physical_sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id),
  client_id UUID REFERENCES public.clients(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  distributor_id UUID REFERENCES public.distributors(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'invoiced', 'delivered', 'cancelled')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Physical Sales Order Items
CREATE TABLE IF NOT EXISTS public.physical_sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.physical_sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Remission Note Items
CREATE TABLE IF NOT EXISTS public.remission_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remission_note_id UUID NOT NULL REFERENCES public.remission_notes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Routes (for physical sales)
CREATE TABLE IF NOT EXISTS public.vendor_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Route Clients (clients in a vendor's route)
CREATE TABLE IF NOT EXISTS public.route_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.vendor_routes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  visit_order INTEGER DEFAULT 0,
  notes TEXT,
  last_visit_at TIMESTAMPTZ
);

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  style TEXT,
  price_adjustment NUMERIC(12,2) DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Units of measure
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  base_unit_id UUID REFERENCES public.units(id),
  conversion_factor NUMERIC(10,4) DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

-- Inventory adjustments
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number TEXT UNIQUE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('positive', 'negative', 'transfer', 'count')),
  reason TEXT,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adjustment details
CREATE TABLE IF NOT EXISTS public.inventory_adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id UUID NOT NULL REFERENCES public.inventory_adjustments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  previous_quantity INTEGER,
  adjusted_quantity INTEGER NOT NULL,
  new_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory transfers between warehouses
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE,
  from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
  notes TEXT,
  created_by UUID,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  received_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transfer items
CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity_sent INTEGER NOT NULL,
  quantity_received INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributor_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remission_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Admin full access to vendors" ON public.vendors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  
CREATE POLICY "Vendors can view own record" ON public.vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for warehouses
CREATE POLICY "Admin full access to warehouses" ON public.warehouses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  
CREATE POLICY "Staff can view warehouses" ON public.warehouses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- RLS Policies for product_warehouse
CREATE POLICY "Admin full access to product_warehouse" ON public.product_warehouse FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Staff can view product_warehouse" ON public.product_warehouse FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- RLS Policies for distributor_orders
CREATE POLICY "Admin full access to distributor_orders" ON public.distributor_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Distributors can manage own orders" ON public.distributor_orders FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.distributors d 
    WHERE d.id = distributor_id AND d.user_id = auth.uid()
  ));

-- RLS Policies for distributor_order_items
CREATE POLICY "Admin full access to distributor_order_items" ON public.distributor_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Distributors can manage own order items" ON public.distributor_order_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.distributor_orders o
    JOIN public.distributors d ON d.id = o.distributor_id
    WHERE o.id = order_id AND d.user_id = auth.uid()
  ));

-- RLS Policies for physical_sales_orders
CREATE POLICY "Admin full access to physical_sales_orders" ON public.physical_sales_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors can manage own physical sales" ON public.physical_sales_orders FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vendors v 
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  ));

-- RLS Policies for physical_sales_order_items
CREATE POLICY "Admin full access to physical_sales_order_items" ON public.physical_sales_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors can manage own physical sales items" ON public.physical_sales_order_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.physical_sales_orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_id AND v.user_id = auth.uid()
  ));

-- Public read access for products, variants, categories
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin full access to product_variants" ON public.product_variants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can view units" ON public.units FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- RLS for inventory adjustments
CREATE POLICY "Admin full access to inventory_adjustments" ON public.inventory_adjustments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access to inventory_adjustment_items" ON public.inventory_adjustment_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access to inventory_transfers" ON public.inventory_transfers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access to inventory_transfer_items" ON public.inventory_transfer_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS for vendor routes
CREATE POLICY "Admin full access to vendor_routes" ON public.vendor_routes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors can manage own routes" ON public.vendor_routes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Admin full access to route_clients" ON public.route_clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors can manage own route clients" ON public.route_clients FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vendor_routes vr
    JOIN public.vendors v ON v.id = vr.vendor_id
    WHERE vr.id = route_id AND v.user_id = auth.uid()
  ));

-- RLS for remission note items
CREATE POLICY "Admin full access to remission_note_items" ON public.remission_note_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert default units
INSERT INTO public.units (name, abbreviation) VALUES 
  ('Pieza', 'pza'),
  ('Caja', 'cja'),
  ('Litro', 'L'),
  ('Mililitro', 'ml'),
  ('Kilogramo', 'kg'),
  ('Gramo', 'g'),
  ('Docena', 'doc')
ON CONFLICT DO NOTHING;

-- Insert default warehouses
INSERT INTO public.warehouses (name, code, warehouse_type) VALUES
  ('Almacén Principal', 'ALM-MAIN', 'physical'),
  ('Almacén E-commerce', 'ALM-ECOM', 'virtual')
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_distributor_orders_distributor_id ON public.distributor_orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_physical_sales_orders_vendor_id ON public.physical_sales_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_warehouse_product_id ON public.product_warehouse(product_id);
CREATE INDEX IF NOT EXISTS idx_product_warehouse_warehouse_id ON public.product_warehouse(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);