-- Fix overly permissive policies
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create client" ON public.clients;
DROP POLICY IF EXISTS "Clients can create orders" ON public.orders;

-- More restrictive policies
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE 
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  ));

CREATE POLICY "Authenticated users can create client profile" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated clients can create orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );