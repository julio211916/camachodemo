-- Add missing RLS policies for tables without policies

-- Stock movements - admins and staff can manage
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- Stock alerts - admins can manage
CREATE POLICY "Admins can manage stock alerts" ON public.stock_alerts FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Demand forecasts - admins can manage
CREATE POLICY "Admins can manage forecasts" ON public.demand_forecasts FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Activity logs - admins only
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Suppliers - admins only
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Documents - user can see own
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
  distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid()) OR
  created_by = auth.uid()
);
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- Companies - admins only
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public can view companies" ON public.companies FOR SELECT USING (true);

-- Cash registers - admins and staff
CREATE POLICY "Staff can manage cash registers" ON public.cash_registers FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- Order items - let users insert when creating orders
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (true);

-- Clients can insert themselves
CREATE POLICY "Anyone can create client" ON public.clients FOR INSERT WITH CHECK (true);

-- Allow admins to insert orders
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- Allow clients to insert their own orders  
CREATE POLICY "Clients can create orders" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);