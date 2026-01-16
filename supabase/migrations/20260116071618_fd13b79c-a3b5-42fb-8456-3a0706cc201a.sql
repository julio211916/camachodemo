-- Fix reviews table RLS policies to prevent email exposure
-- Drop the overly permissive public SELECT policies that expose patient_email

DROP POLICY IF EXISTS "Public can see published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Published reviews are visible to everyone" ON public.reviews;

-- Staff and admins can view ALL reviews (including emails for management)
-- This policy already exists, keeping it:
-- "Staff can view all reviews" - allows staff to manage reviews

-- Patients can view their OWN reviews only
CREATE POLICY "Patients can view own reviews"
ON public.reviews FOR SELECT
USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);

-- Public access should ONLY go through the reviews_public view
-- which excludes patient_email. The view already exists.
-- Ensure the reviews_public view has proper security

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.reviews_public TO anon, authenticated;