-- =====================================================
-- E-COMMERCE SCHEMA FOR PRODUCTOS CAMACHO
-- =====================================================

-- Categories for products
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES public.categories(id),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table (enhanced)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  barcode text,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  category_id uuid REFERENCES public.categories(id),
  brand_id uuid REFERENCES public.brands(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  unit text DEFAULT 'PZ',
  weight numeric,
  cost_price numeric NOT NULL DEFAULT 0,
  retail_price numeric NOT NULL,
  wholesale_price numeric,
  distributor_price numeric,
  min_stock integer DEFAULT 0,
  max_stock integer,
  reorder_point integer DEFAULT 10,
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stock movements history
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id),
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  previous_quantity integer,
  new_quantity integer,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Stock alerts
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  threshold integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Clients (B2C customers)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  rfc text,
  client_type text DEFAULT 'retail',
  discount_percentage numeric DEFAULT 0,
  credit_limit numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  loyalty_points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Distributors
CREATE TABLE IF NOT EXISTS public.distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  business_name text NOT NULL,
  legal_name text,
  rfc text,
  contact_name text,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  discount_percentage numeric DEFAULT 15,
  credit_limit numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  zone text,
  is_active boolean DEFAULT true,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees/Vendors
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  employee_code text UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  position text DEFAULT 'vendedor',
  location_id uuid REFERENCES public.locations(id),
  commission_rate numeric DEFAULT 0,
  base_salary numeric DEFAULT 0,
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shopping carts
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  client_id uuid REFERENCES public.clients(id),
  status text DEFAULT 'active',
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  distributor_id uuid REFERENCES public.distributors(id),
  employee_id uuid REFERENCES public.employees(id),
  location_id uuid REFERENCES public.locations(id),
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_type text DEFAULT 'cash',
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_method text,
  shipping_cost numeric DEFAULT 0,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  discount_code text,
  tax_rate numeric DEFAULT 16,
  tax_amount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  notes text,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_rate numeric DEFAULT 16,
  tax_amount numeric DEFAULT 0,
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Demand forecasts for inventory planning
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  forecast_date date NOT NULL,
  predicted_demand integer NOT NULL,
  actual_demand integer,
  confidence_level numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, forecast_date)
);

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Documents (invoices, quotes, etc.)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  document_number text NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  client_id uuid REFERENCES public.clients(id),
  distributor_id uuid REFERENCES public.distributors(id),
  content jsonb,
  pdf_url text,
  status text DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies (for multi-company support)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  rfc text,
  address text,
  phone text,
  email text,
  logo_url text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Cash registers
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id),
  name text NOT NULL,
  status text DEFAULT 'closed',
  opening_amount numeric DEFAULT 0,
  current_amount numeric DEFAULT 0,
  opened_by uuid,
  opened_at timestamptz,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  context text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Public read for products and categories
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (is_active = true);

-- Auth users can manage their carts
CREATE POLICY "Users can manage own carts" ON public.carts FOR ALL USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid() OR session_id IS NOT NULL)
);

-- Clients can view own data
CREATE POLICY "Clients can view own data" ON public.clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Clients can update own data" ON public.clients FOR UPDATE USING (user_id = auth.uid());

-- Distributors can view own data
CREATE POLICY "Distributors can view own data" ON public.distributors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Distributors can update own data" ON public.distributors FOR UPDATE USING (user_id = auth.uid());

-- Employees can view own data
CREATE POLICY "Employees can view own data" ON public.employees FOR SELECT USING (user_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
  distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid()) OR
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE 
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid())
  )
);

-- AI conversations
CREATE POLICY "Users can manage own conversations" ON public.ai_conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own messages" ON public.ai_messages FOR ALL USING (
  conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
);

-- Admin policies (check role)
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage all categories" ON public.categories FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all clients" ON public.clients FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all distributors" ON public.distributors FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all employees" ON public.employees FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Staff/Vendor policies
CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));
CREATE POLICY "Staff can manage orders" ON public.orders FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_distributors_updated_at ON public.distributors;
CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON public.distributors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  prefix TEXT;
BEGIN
  prefix := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  SELECT prefix || LPAD((COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INTEGER), 0) + 1)::TEXT, 4, '0')
  INTO new_number
  FROM public.orders
  WHERE order_number LIKE prefix || '%';
  RETURN new_number;
END;
$$;

-- Insert default categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Químicos', 'quimicos', 'Productos químicos medicinales', 1),
  ('Lociones', 'lociones', 'Lociones para cabello y corporales', 2),
  ('Aceites', 'aceites', 'Aceites naturales y medicinales', 3),
  ('Jarabes', 'jarabes', 'Jarabes naturales y medicinales', 4),
  ('Bálsamos', 'balsamos', 'Bálsamos y ungüentos', 5),
  ('Vinos', 'vinos', 'Vinos medicinales', 6),
  ('Botánicos', 'botanicos', 'Productos botánicos y naturales', 7),
  ('Pomadas', 'pomadas', 'Pomadas medicinales', 8),
  ('Gotas', 'gotas', 'Gotas y soluciones', 9)
ON CONFLICT (slug) DO NOTHING;

-- Insert default company
INSERT INTO public.companies (name, legal_name, rfc, is_default) VALUES
  ('Productos Camacho', 'Productos Camacho S.A. de C.V.', 'XAXX010101000', true)
ON CONFLICT DO NOTHING;