-- =============================================
-- NOVELLDENT v2.0 - ARQUITECTURA MULTI-SUCURSAL
-- Configuración base sin dependencias de auth.users
-- =============================================

-- 1. Insertar sucursales principales
INSERT INTO locations (id, name, address, phone, city, state, is_active, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Clínica Nayarit', 'Av. México #123, Col. Centro', '+52 311 123 4567', 'Tepic', 'Nayarit', true, 1),
  ('22222222-2222-2222-2222-222222222222', 'Clínica Jalisco', 'Av. Vallarta #456, Col. Moderna', '+52 33 987 6543', 'Guadalajara', 'Jalisco', true, 2),
  ('33333333-3333-3333-3333-333333333333', 'Clínica CDMX', 'Av. Insurgentes Sur #789', '+52 55 555 1234', 'Ciudad de México', 'CDMX', true, 3)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, address = EXCLUDED.address, phone = EXCLUDED.phone, city = EXCLUDED.city, state = EXCLUDED.state;

-- 2. Crear tabla de configuración por sucursal
CREATE TABLE IF NOT EXISTS public.branch_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'America/Mexico_City',
  currency TEXT DEFAULT 'MXN',
  rfc TEXT,
  razon_social TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(location_id)
);

ALTER TABLE public.branch_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage branch settings" ON public.branch_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view branch settings" ON public.branch_settings
  FOR SELECT USING (true);

INSERT INTO branch_settings (location_id, rfc, razon_social)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'NAY123456ABC', 'NovellDent Nayarit S.A. de C.V.'),
  ('22222222-2222-2222-2222-222222222222', 'JAL789012DEF', 'NovellDent Jalisco S.A. de C.V.'),
  ('33333333-3333-3333-3333-333333333333', 'CDM345678GHI', 'NovellDent CDMX S.A. de C.V.')
ON CONFLICT (location_id) DO NOTHING;

-- 3. Insertar catálogo completo de servicios
DELETE FROM services_catalog WHERE code LIKE 'DIAG-%' OR code LIKE 'PROP-%' OR code LIKE 'REST-%' OR code LIKE 'ENDO-%' OR code LIKE 'CIRU-%' OR code LIKE 'PROT-%' OR code LIKE 'IMPL-%' OR code LIKE 'ESTE-%' OR code LIKE 'ORTO-%' OR code LIKE 'PEDI-%';

INSERT INTO services_catalog (code, name, category, base_price, convention_price, cost, duration_minutes, is_active, display_order, description)
VALUES
  ('DIAG-001', 'Consulta Diagnóstico', 'Diagnóstico', 500, 450, 50, 30, true, 1, 'Consulta inicial'),
  ('DIAG-002', 'Radiografía Periapical', 'Diagnóstico', 350, 315, 30, 15, true, 2, 'Rx digital'),
  ('DIAG-003', 'Radiografía Panorámica', 'Diagnóstico', 800, 720, 80, 20, true, 3, 'Ortopantomografía'),
  ('PROP-001', 'Limpieza Dental', 'Profilaxis', 800, 720, 80, 45, true, 4, 'Profilaxis con ultrasonido'),
  ('PROP-002', 'Limpieza Profunda', 'Profilaxis', 1200, 1080, 100, 60, true, 5, 'Raspado y alisado'),
  ('REST-001', 'Resina Simple', 'Restauración', 1200, 1080, 150, 45, true, 6, '1 superficie'),
  ('REST-002', 'Resina 2 Superficies', 'Restauración', 1500, 1350, 180, 60, true, 7, '2 superficies'),
  ('ENDO-001', 'Endodoncia Anterior', 'Endodoncia', 3500, 3150, 300, 90, true, 8, 'Conducto anterior'),
  ('ENDO-002', 'Endodoncia Molar', 'Endodoncia', 5500, 4950, 500, 150, true, 9, 'Conducto molar'),
  ('CIRU-001', 'Extracción Simple', 'Cirugía', 1200, 1080, 100, 30, true, 10, 'Extracción dental'),
  ('CIRU-002', 'Cirugía Tercer Molar', 'Cirugía', 4500, 4050, 400, 90, true, 11, 'Muela del juicio'),
  ('PROT-001', 'Corona Zirconio', 'Prótesis', 8000, 7200, 1200, 60, true, 12, 'Corona cerámica'),
  ('PROT-002', 'Puente 3 Unidades', 'Prótesis', 18000, 16200, 3000, 120, true, 13, 'Puente fijo'),
  ('IMPL-001', 'Implante Dental', 'Implantología', 18000, 16200, 5000, 90, true, 14, 'Implante titanio'),
  ('IMPL-002', 'Corona sobre Implante', 'Implantología', 12000, 10800, 2500, 60, true, 15, 'Corona definitiva'),
  ('ESTE-001', 'Blanqueamiento LED', 'Estética', 5500, 4950, 500, 90, true, 16, 'En consultorio'),
  ('ESTE-002', 'Carillas Porcelana', 'Estética', 9000, 8100, 1500, 60, true, 17, 'Por diente'),
  ('ORTO-001', 'Brackets Metálicos', 'Ortodoncia', 35000, 31500, 8000, 60, true, 18, 'Tratamiento completo'),
  ('ORTO-002', 'Invisalign', 'Ortodoncia', 65000, 58500, 25000, 45, true, 19, 'Alineadores'),
  ('PEDI-001', 'Consulta Infantil', 'Odontopediatría', 450, 405, 40, 30, true, 20, 'Niños');

-- 4. Insertar leads demo en CRM
INSERT INTO leads (name, email, phone, source, interest, status, score, location_id, notes)
VALUES
  ('Sandra López Vega', 'sandra.lopez@gmail.com', '+52 311 666 1111', 'website', 'Implantes', 'new', 75, '11111111-1111-1111-1111-111111111111', 'Interesada en implantes'),
  ('Ricardo Méndez', 'ricardo.mendez@outlook.com', '+52 311 666 2222', 'google_ads', 'Ortodoncia', 'contacted', 60, '11111111-1111-1111-1111-111111111111', 'Pidió información'),
  ('Gabriela Núñez', 'gaby.nunez@yahoo.com', '+52 33 666 3333', 'referral', 'Blanqueamiento', 'qualified', 85, '22222222-2222-2222-2222-222222222222', 'Excelente prospecto'),
  ('Verónica Campos', 'vero.campos@gmail.com', '+52 55 666 5555', 'instagram', 'Diseño de Sonrisa', 'negotiation', 90, '33333333-3333-3333-3333-333333333333', 'Muy interesada')
ON CONFLICT DO NOTHING;

-- 5. Insertar inventario demo
INSERT INTO inventory (name, category, quantity, min_stock, unit, unit_cost, supplier, location_id)
VALUES
  ('Guantes Látex M', 'Desechables', 500, 100, 'pieza', 1.50, 'Dental Depot', '11111111-1111-1111-1111-111111111111'),
  ('Resina Filtek Z350', 'Materiales', 25, 10, 'jeringa', 450, '3M ESPE', '11111111-1111-1111-1111-111111111111'),
  ('Anestesia Lidocaína', 'Anestésicos', 100, 30, 'cartucho', 25, 'Zeyco', '22222222-2222-2222-2222-222222222222'),
  ('Implantes Straumann', 'Implantes', 15, 5, 'pieza', 8500, 'Straumann MX', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- 6. Insertar gastos demo
INSERT INTO expenses (description, amount, category, expense_date, payment_method, location_id)
VALUES
  ('Luz Enero 2026', 2800, 'Servicios', CURRENT_DATE - INTERVAL '5 days', 'transferencia', '11111111-1111-1111-1111-111111111111'),
  ('Materiales dentales', 8500, 'Materiales', CURRENT_DATE - INTERVAL '3 days', 'tarjeta', '11111111-1111-1111-1111-111111111111'),
  ('Renta Enero', 35000, 'Renta', CURRENT_DATE - INTERVAL '12 days', 'transferencia', '22222222-2222-2222-2222-222222222222'),
  ('Nómina quincenal', 85000, 'Nómina', CURRENT_DATE - INTERVAL '7 days', 'transferencia', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- 7. Índices para consultas multi-sucursal
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location_date ON appointments(location_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_leads_location_status ON leads(location_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_expenses_location_date ON expenses(location_id, expense_date);