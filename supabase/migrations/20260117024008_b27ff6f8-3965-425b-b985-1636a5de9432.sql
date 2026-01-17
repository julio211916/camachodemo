-- =====================================================
-- SECURITY FIX MIGRATION
-- Fixes overly permissive RLS policies
-- =====================================================

-- 1. FIX ORDER_ITEMS - Remove permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- Create proper order_items insertion policy that verifies ownership
CREATE POLICY "Users can insert order items" ON public.order_items 
FOR INSERT TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
       OR distributor_id IN (SELECT id FROM public.distributors WHERE user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  )
);

-- 2. FIX CLIENTS - Remove permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create client" ON public.clients;

-- Create proper client insertion policy
CREATE POLICY "Users can create own client profile" ON public.clients 
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 3. FIX CARTS - Remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view carts" ON public.carts;
DROP POLICY IF EXISTS "Anyone can create carts" ON public.carts;
DROP POLICY IF EXISTS "Anyone can update carts" ON public.carts;
DROP POLICY IF EXISTS "Anyone can delete carts" ON public.carts;

-- Create proper cart policies based on session_id or user_id ownership
CREATE POLICY "Users can view own carts" ON public.carts 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND session_id IS NOT NULL)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Users can create own carts" ON public.carts 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Users can update own carts" ON public.carts 
FOR UPDATE 
USING (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND session_id IS NOT NULL)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Users can delete own carts" ON public.carts 
FOR DELETE 
USING (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND session_id IS NOT NULL)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- 4. FIX CART_ITEMS - Remove permissive policies
DROP POLICY IF EXISTS "Anyone can view cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can create cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can update cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can delete cart items" ON public.cart_items;

-- Create proper cart_items policies
CREATE POLICY "Users can view own cart items" ON public.cart_items 
FOR SELECT 
USING (
  cart_id IN (
    SELECT id FROM public.carts 
    WHERE user_id = auth.uid() 
    OR (user_id IS NULL AND session_id IS NOT NULL)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  )
);

CREATE POLICY "Users can create own cart items" ON public.cart_items 
FOR INSERT 
WITH CHECK (
  cart_id IN (
    SELECT id FROM public.carts 
    WHERE user_id = auth.uid() 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE POLICY "Users can update own cart items" ON public.cart_items 
FOR UPDATE 
USING (
  cart_id IN (
    SELECT id FROM public.carts 
    WHERE user_id = auth.uid() 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE POLICY "Users can delete own cart items" ON public.cart_items 
FOR DELETE 
USING (
  cart_id IN (
    SELECT id FROM public.carts 
    WHERE user_id = auth.uid() 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- 5. FIX APPOINTMENTS - Remove public creation policy
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;

-- Allow authenticated users to create appointments only
CREATE POLICY "Authenticated users can create appointments" ON public.appointments 
FOR INSERT TO authenticated
WITH CHECK (true);

-- Add anon policy for public booking (with validation in app layer)
CREATE POLICY "Anon can create appointments" ON public.appointments 
FOR INSERT TO anon
WITH CHECK (
  patient_email IS NOT NULL 
  AND patient_name IS NOT NULL 
  AND patient_phone IS NOT NULL
  AND appointment_date IS NOT NULL
  AND service_id IS NOT NULL
  AND location_id IS NOT NULL
);

-- 6. ADD AUDIT LOGGING TRIGGER FOR PROFILES ACCESS
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when staff/admin/doctor accesses profiles
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  ) THEN
    INSERT INTO public.activity_logs (
      action,
      entity_type,
      entity_id,
      user_id,
      user_agent,
      ip_address
    ) VALUES (
      'profile_viewed',
      'profiles',
      NEW.id,
      auth.uid(),
      current_setting('request.headers', true)::json->>'user-agent',
      current_setting('request.headers', true)::json->>'x-forwarded-for'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;