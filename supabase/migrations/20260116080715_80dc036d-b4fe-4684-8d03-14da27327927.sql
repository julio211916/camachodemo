
-- Fix 1: Add search_path to generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN 'REF-' || result;
END;
$function$;

-- Fix 2: Move pg_net extension to extensions schema
-- First create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the extension (this requires dropping and recreating)
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Fix 3: Replace overly permissive push_subscriptions policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create push subscriptions" ON public.push_subscriptions;

-- Create a more restrictive policy for push subscriptions
-- Allow authenticated users OR unauthenticated users with a valid patient_email
CREATE POLICY "Validated push subscription creation" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) 
  OR (patient_email IS NOT NULL AND patient_email ~ '^[^@]+@[^@]+\.[^@]+$')
);
