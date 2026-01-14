-- Fix referrals RLS policy: Replace USING(true) with proper access control
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can update referrals" ON public.referrals;

-- Create properly scoped SELECT policy for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals 
FOR SELECT 
USING (
  referrer_patient_id = auth.uid() 
  OR referred_patient_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- Create properly scoped UPDATE policy for referrals (admins/staff only)
CREATE POLICY "Staff can update referrals" ON public.referrals 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- Make patient-documents bucket private and add RLS policies for storage
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('patient-documents', 'patient-files');

-- Drop existing storage policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can read patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete patient documents" ON storage.objects;

-- Create storage policies for patient-documents bucket
CREATE POLICY "Staff can read patient documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id IN ('patient-documents', 'patient-files')
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

CREATE POLICY "Staff can upload patient documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('patient-documents', 'patient-files')
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

CREATE POLICY "Staff can delete patient documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id IN ('patient-documents', 'patient-files')
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

-- Update handle_new_user function to assign default patient role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  
  -- Assign default patient role if no role is assigned
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::app_role)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;