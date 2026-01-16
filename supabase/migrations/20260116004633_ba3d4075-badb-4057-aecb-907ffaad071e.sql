-- Fix #1: Add authorization check to mark_lead_as_won function
CREATE OR REPLACE FUNCTION public.mark_lead_as_won(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- CRITICAL: Add authorization check - only admin or staff can mark leads as won
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id 
    AND role IN ('admin', 'staff')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized - requires admin or staff role'
    );
  END IF;
  
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found');
  END IF;
  
  IF v_lead.converted_patient_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead already converted');
  END IF;
  
  UPDATE public.leads 
  SET status = 'ganado', converted_at = NOW(), updated_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'lead_id', p_lead_id,
    'name', v_lead.name,
    'email', v_lead.email,
    'phone', v_lead.phone
  );
END;
$$;

-- Fix #2: Create public view for reviews that excludes email addresses
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
SELECT 
  id,
  patient_name,
  rating,
  comment,
  location_id,
  location_name,
  service_id,
  service_name,
  created_at,
  is_published,
  appointment_id
FROM public.reviews
WHERE is_published = true;

-- Grant public access to the view
GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- Fix #3: Make patient-documents bucket private and add proper storage RLS
-- First, update the bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('patient-documents', 'patient-files');

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Patient documents are accessible to staff" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;

-- Create storage RLS policies for patient-documents bucket
-- Staff/Admin/Doctor can access all patient documents
CREATE POLICY "Staff can access patient documents"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('patient-documents', 'patient-files') AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

-- Staff/Admin/Doctor can upload patient documents
CREATE POLICY "Staff can upload patient documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('patient-documents', 'patient-files') AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

-- Staff/Admin/Doctor can update patient documents
CREATE POLICY "Staff can update patient documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('patient-documents', 'patient-files') AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

-- Staff/Admin/Doctor can delete patient documents
CREATE POLICY "Staff can delete patient documents"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('patient-documents', 'patient-files') AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'doctor')
  )
);

-- Patients can view their own documents (folder starts with their profile ID)
CREATE POLICY "Patients can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('patient-documents', 'patient-files') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);