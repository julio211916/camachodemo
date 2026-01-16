-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.reviews_public;

-- Create view with SECURITY INVOKER (default, but explicitly set)
CREATE VIEW public.reviews_public 
WITH (security_invoker = true)
AS
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