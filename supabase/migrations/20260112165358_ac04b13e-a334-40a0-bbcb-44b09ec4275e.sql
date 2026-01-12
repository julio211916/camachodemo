-- Add gender, birth_year, tags, and is_archived to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create patient_notes table for detailed notes
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can manage patient notes" 
ON public.patient_notes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view their own notes" 
ON public.patient_notes 
FOR SELECT 
USING (patient_id = auth.uid());

-- Create storage bucket for patient files including 3D models and DICOM
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-files', 'patient-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for patient-files bucket
CREATE POLICY "Staff can manage patient files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'patient-files' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'doctor'::app_role)
));

CREATE POLICY "Patients can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'patient-files' AND auth.uid()::text = (storage.foldername(name))[1]);