-- Fix appointment data exposure vulnerability
-- The current "Public can create appointments" policy allows SELECT implicitly
-- We need to ensure public can only INSERT, not SELECT

-- First, drop the vulnerable policy (if it still exists)
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;

-- Drop any potentially overly permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;

-- Drop existing policies before recreating them to avoid conflicts
DROP POLICY IF EXISTS "Staff can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;

-- Create a properly scoped INSERT-only policy for public appointment creation
CREATE POLICY "Public can create appointments" 
ON public.appointments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  patient_email IS NOT NULL AND 
  patient_name IS NOT NULL AND 
  service_id IS NOT NULL
);

-- Create proper SELECT policies that restrict access
-- Staff and admins can view all appointments
CREATE POLICY "Staff can view all appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- Doctors can view their assigned appointments
CREATE POLICY "Doctors can view assigned appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor') AND 
  doctor_id = (SELECT id FROM public.doctors WHERE user_id = auth.uid() LIMIT 1)
);

-- Patients can view their own appointments by email
CREATE POLICY "Patients can view own appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);