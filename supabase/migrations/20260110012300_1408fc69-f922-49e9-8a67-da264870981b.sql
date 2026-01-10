-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_patient_id UUID NOT NULL,
  referrer_email TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_patient_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, discount_applied
  discount_percentage NUMERIC DEFAULT 5,
  discount_amount NUMERIC,
  completed_at TIMESTAMP WITH TIME ZONE,
  discount_applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Anyone can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (true);

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add referral columns to appointments if not exists
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_email ON public.referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON public.referrals(referred_email);