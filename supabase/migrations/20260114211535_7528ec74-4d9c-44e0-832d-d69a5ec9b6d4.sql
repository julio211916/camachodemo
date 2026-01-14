-- ==============================================================
-- FIX: ARCHITECTURE UPDATES WITHOUT FK CONSTRAINT VIOLATIONS
-- CRM Auto-Conversion, Multi-Branch, Lead Interactions, Services
-- ==============================================================

-- 1. Create lead_interactions table for tracking lead activities
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'call', 'email', 'whatsapp', 'visit', 'note'
  notes TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage lead interactions" ON public.lead_interactions;
CREATE POLICY "Staff can manage lead interactions" ON public.lead_interactions FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'doctor')));

-- 2. Add location_id column to profiles for multi-branch support
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location_id') THEN
    ALTER TABLE public.profiles ADD COLUMN location_id UUID;
  END IF;
END $$;

-- 3. Add location_id to leads for multi-branch CRM
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'location_id') THEN
    ALTER TABLE public.leads ADD COLUMN location_id UUID;
  END IF;
END $$;

-- 4. Create the convert lead to patient function (stores patient data in leads table for now)
-- This is called from the frontend to mark a lead as won and create the patient
CREATE OR REPLACE FUNCTION public.mark_lead_as_won(p_lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found');
  END IF;
  
  IF v_lead.converted_patient_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead already converted');
  END IF;
  
  -- Update lead status to won and mark conversion time
  UPDATE public.leads 
  SET 
    status = 'ganado',
    converted_at = NOW(),
    updated_at = NOW()
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

-- 5. Add more columns to services_catalog for completeness
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services_catalog' AND column_name = 'iva_rate') THEN
    ALTER TABLE public.services_catalog ADD COLUMN iva_rate DECIMAL(5,2) DEFAULT 16;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services_catalog' AND column_name = 'lab_cost') THEN
    ALTER TABLE public.services_catalog ADD COLUMN lab_cost DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services_catalog' AND column_name = 'commission_rate') THEN
    ALTER TABLE public.services_catalog ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 30;
  END IF;
END $$;

-- 6. Insert demo data for services catalog if empty
INSERT INTO public.services_catalog (code, name, description, category, base_price, convention_price, cost, duration_minutes, is_active, requires_lab)
SELECT * FROM (VALUES
  ('DIAG-001', 'Consulta Diagnóstico', 'Evaluación inicial completa', 'Diagnóstico', 500, 450, 50, 30, TRUE, FALSE),
  ('DIAG-002', 'Radiografía Periapical', 'Radiografía individual', 'Diagnóstico', 350, 315, 30, 15, TRUE, FALSE),
  ('PROP-001', 'Profilaxis Dental', 'Limpieza dental profesional', 'Profilaxis', 800, 720, 80, 45, TRUE, FALSE),
  ('REST-001', 'Resina Simple', 'Restauración con resina compuesta', 'Restauración', 1200, 1080, 150, 30, TRUE, FALSE),
  ('REST-002', 'Resina Compuesta', 'Restauración múltiples superficies', 'Restauración', 1800, 1620, 200, 45, TRUE, FALSE),
  ('ENDO-001', 'Endodoncia Anterior', 'Tratamiento de conducto anterior', 'Endodoncia', 3500, 3150, 350, 90, TRUE, FALSE),
  ('ENDO-002', 'Endodoncia Molar', 'Tratamiento de conducto molar', 'Endodoncia', 4500, 4050, 450, 120, TRUE, FALSE),
  ('CIRU-001', 'Extracción Simple', 'Extracción dental simple', 'Cirugía', 1200, 1080, 100, 30, TRUE, FALSE),
  ('CIRU-002', 'Extracción Compleja', 'Extracción quirúrgica', 'Cirugía', 2500, 2250, 200, 60, TRUE, FALSE),
  ('PROT-001', 'Corona Zirconio', 'Corona de zirconio premium', 'Prótesis', 8000, 7200, 3000, 60, TRUE, TRUE),
  ('PROT-002', 'Corona Metal-Porcelana', 'Corona metal-porcelana', 'Prótesis', 5500, 4950, 2000, 60, TRUE, TRUE),
  ('IMPL-001', 'Implante Dental', 'Colocación de implante', 'Implantología', 18000, 16200, 8000, 120, TRUE, TRUE),
  ('ORTO-001', 'Ortodoncia Convencional', 'Brackets metálicos mensual', 'Ortodoncia', 2500, 2250, 500, 30, TRUE, TRUE),
  ('ESTE-001', 'Blanqueamiento LED', 'Blanqueamiento en consultorio', 'Estética', 5500, 4950, 500, 90, TRUE, FALSE),
  ('ESTE-002', 'Carillas de Porcelana', 'Carilla estética por pieza', 'Estética', 12000, 10800, 4000, 60, TRUE, TRUE)
) AS v(code, name, description, category, base_price, convention_price, cost, duration_minutes, is_active, requires_lab)
WHERE NOT EXISTS (SELECT 1 FROM public.services_catalog LIMIT 1);

-- 7. Add RLS policy for leads to allow staff to manage
DROP POLICY IF EXISTS "Staff can manage leads" ON public.leads;
CREATE POLICY "Staff can manage leads" ON public.leads FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'doctor')));

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON public.leads(converted_patient_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_services_catalog_category ON public.services_catalog(category);
CREATE INDEX IF NOT EXISTS idx_services_catalog_active ON public.services_catalog(is_active);

-- 9. Insert demo locations if empty
INSERT INTO public.locations (name, address, phone, city, state, is_active, display_order)
SELECT * FROM (VALUES
  ('NovellDent Nayarit', 'Av. México 123, Col. Centro', '+52 311 123 4567', 'Tepic', 'Nayarit', TRUE, 1),
  ('NovellDent Jalisco', 'Av. Vallarta 456, Col. Americana', '+52 33 987 6543', 'Guadalajara', 'Jalisco', TRUE, 2)
) AS v(name, address, phone, city, state, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.locations LIMIT 1);