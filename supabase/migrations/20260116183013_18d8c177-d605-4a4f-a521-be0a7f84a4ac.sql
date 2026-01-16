-- Fix security issues for carts and cart_items tables
DROP POLICY IF EXISTS "Public can view carts" ON carts;
DROP POLICY IF EXISTS "Public can create carts" ON carts;
DROP POLICY IF EXISTS "Public can update carts" ON carts;
DROP POLICY IF EXISTS "Public can delete carts" ON carts;
DROP POLICY IF EXISTS "Public can view cart items" ON cart_items;
DROP POLICY IF EXISTS "Public can create cart items" ON cart_items;
DROP POLICY IF EXISTS "Public can update cart items" ON cart_items;
DROP POLICY IF EXISTS "Public can delete cart items" ON cart_items;

-- Secure RLS policies for carts
CREATE POLICY "Users can view their own carts" ON carts
FOR SELECT USING (
  auth.uid() = user_id OR 
  session_id = current_setting('request.headers', true)::json->>'x-session-id' OR
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own carts" ON carts
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IS NULL
);

CREATE POLICY "Users can update their own carts" ON carts
FOR UPDATE USING (
  auth.uid() = user_id OR 
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "Users can delete their own carts" ON carts
FOR DELETE USING (
  auth.uid() = user_id
);

-- Secure RLS policies for cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
FOR SELECT USING (
  cart_id IN (
    SELECT id FROM carts WHERE 
      auth.uid() = user_id OR 
      session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
);

CREATE POLICY "Users can create cart items in their carts" ON cart_items
FOR INSERT WITH CHECK (
  cart_id IN (
    SELECT id FROM carts WHERE 
      auth.uid() = user_id OR 
      session_id = current_setting('request.headers', true)::json->>'x-session-id' OR
      auth.uid() IS NULL
  )
);

CREATE POLICY "Users can update their own cart items" ON cart_items
FOR UPDATE USING (
  cart_id IN (
    SELECT id FROM carts WHERE 
      auth.uid() = user_id OR 
      session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
);

CREATE POLICY "Users can delete their own cart items" ON cart_items
FOR DELETE USING (
  cart_id IN (
    SELECT id FROM carts WHERE 
      auth.uid() = user_id OR 
      session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
);

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Casa',
  street TEXT NOT NULL,
  number_ext TEXT,
  number_int TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'México',
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses" ON customer_addresses
FOR ALL USING (auth.uid() = user_id);

-- Create customer_favorites table
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON customer_favorites
FOR ALL USING (auth.uid() = user_id);

-- Create employee_commissions table for payroll
CREATE TABLE IF NOT EXISTS public.employee_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  rate DECIMAL(5,4) DEFAULT 0.05,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employee_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all commissions" ON employee_commissions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Staff can manage commissions" ON employee_commissions
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create payroll_periods table
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'processing', 'closed', 'paid')),
  total_base_salary DECIMAL(12,2) DEFAULT 0,
  total_commissions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_net DECIMAL(12,2) DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payroll" ON payroll_periods
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Admin can manage payroll" ON payroll_periods
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create finance_transactions for better financial tracking
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  location_id UUID REFERENCES locations(id),
  created_by UUID REFERENCES auth.users(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view finances" ON finance_transactions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Staff can manage finances" ON finance_transactions
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Create remission_notes table for document generation
CREATE TABLE IF NOT EXISTS public.remission_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id),
  qr_code TEXT,
  client_id UUID REFERENCES clients(id),
  distributor_id UUID REFERENCES distributors(id),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.remission_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage remission notes" ON remission_notes
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Create sales_tickets table
CREATE TABLE IF NOT EXISTS public.sales_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id),
  qr_code TEXT,
  employee_id UUID REFERENCES employees(id),
  location_id UUID REFERENCES locations(id),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sales_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage tickets" ON sales_tickets
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_user ON customer_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_employee ON employee_commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_remission_notes_order ON remission_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_tickets_order ON sales_tickets(order_id);