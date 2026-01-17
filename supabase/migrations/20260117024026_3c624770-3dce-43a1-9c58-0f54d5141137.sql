-- =====================================================
-- SECURITY FIX MIGRATION - PART 2
-- Fix remaining permissive policies
-- =====================================================

-- 1. FIX "Authenticated users can create appointments" - make it stricter
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;

-- Authenticated users can create appointments with required fields
CREATE POLICY "Authenticated users can create appointments" ON public.appointments 
FOR INSERT TO authenticated
WITH CHECK (
  patient_email IS NOT NULL 
  AND patient_name IS NOT NULL 
  AND patient_phone IS NOT NULL
  AND appointment_date IS NOT NULL
  AND service_id IS NOT NULL
  AND location_id IS NOT NULL
);

-- 2. FIX "Anyone can add cart items" - remove and create proper policy
DROP POLICY IF EXISTS "Anyone can add cart items" ON public.cart_items;

-- Already created proper cart_items policies in previous migration

-- 3. FIX "Staff can insert order status" - verify staff role
DROP POLICY IF EXISTS "Staff can insert order status" ON public.order_status_history;

CREATE POLICY "Staff can insert order status" ON public.order_status_history 
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
);