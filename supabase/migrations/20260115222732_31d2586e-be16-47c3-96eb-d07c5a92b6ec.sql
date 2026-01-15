-- Add admin master flag and patient/referral codes to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin_master BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS patient_code VARCHAR(20);

-- Update the admin master profile
UPDATE profiles SET is_admin_master = true WHERE email = 'admin@novelldent.com';

-- Add note_type column to patient_notes
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Create doctor-patient assignment table
CREATE TABLE IF NOT EXISTS doctor_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  patient_profile_id UUID NOT NULL REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT TRUE,
  UNIQUE(doctor_id, patient_profile_id)
);

-- Enable RLS
ALTER TABLE doctor_patients ENABLE ROW LEVEL SECURITY;

-- Doctors can see their own patient assignments
CREATE POLICY "Doctors can view their patient assignments"
ON doctor_patients FOR SELECT
TO authenticated
USING (doctor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage patient assignments
CREATE POLICY "Admins can manage patient assignments"
ON doctor_patients FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));