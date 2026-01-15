-- =====================================================
-- UNIFICAR SUCURSALES - NOVELLDENT REAL (SIN VIEW)
-- =====================================================

-- Actualizar las 3 sucursales existentes con los datos reales
UPDATE locations SET 
  name = 'Matriz Tepic',
  address = 'Av. México #123, Col. Centro',
  city = 'Tepic',
  state = 'Nayarit',
  phone = '+52 311 133 8000',
  display_order = 1
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE locations SET 
  name = 'Marina Nuevo Nayarit',
  address = 'Nuevo Vallarta Plaza Business Center',
  city = 'Bahía de Banderas',
  state = 'Nayarit',
  phone = '+52 322 183 7666',
  display_order = 2
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE locations SET 
  name = 'Centro Empresarial Nuevo Nayarit',
  address = 'Núcleo Médico Joya',
  city = 'Bahía de Banderas',
  state = 'Nayarit',
  phone = '+52 322 183 7666',
  display_order = 3
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Insertar 4ta y 5ta sucursal
INSERT INTO locations (id, name, address, city, state, phone, is_active, display_order)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'Puerto Mágico Puerto Vallarta', 'Plaza Puerto Mágico', 'Puerto Vallarta', 'Jalisco', '+52 322 183 7666', true, 4),
  ('55555555-5555-5555-5555-555555555555', 'NovellDent Guadalajara', 'Av. Vallarta #456, Col. Moderna', 'Guadalajara', 'Jalisco', '+52 33 987 6543', true, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  phone = EXCLUDED.phone,
  display_order = EXCLUDED.display_order;

-- Branch settings para nuevas sucursales
INSERT INTO branch_settings (location_id, rfc, razon_social, timezone, currency)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'NPV260115PM4', 'NovellDent Puerto Vallarta S.A. de C.V.', 'America/Mexico_City', 'MXN'),
  ('55555555-5555-5555-5555-555555555555', 'NGD260115GD5', 'NovellDent Guadalajara S.A. de C.V.', 'America/Mexico_City', 'MXN')
ON CONFLICT (location_id) DO NOTHING;

-- Transacciones demo
INSERT INTO transactions (id, location_id, transaction_type, category, description, amount, payment_method, status, transaction_date, patient_name)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ingreso', 'servicios', 'Limpieza - Cliente Matriz', 600.00, 'cash', 'completed', CURRENT_DATE, 'Juan Pérez'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'ingreso', 'servicios', 'Blanqueamiento - Marina', 2000.00, 'card', 'completed', CURRENT_DATE, 'Ana García'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'ingreso', 'servicios', 'Consulta - Centro Empresarial', 500.00, 'cash', 'completed', CURRENT_DATE, 'Luis Torres'),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'ingreso', 'servicios', 'Ortodoncia - Puerto Mágico', 1500.00, 'card', 'completed', CURRENT_DATE, 'María Ruiz'),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'ingreso', 'servicios', 'Implante - Guadalajara', 12000.00, 'transfer', 'completed', CURRENT_DATE, 'Carlos Mendoza'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'egreso', 'insumos', 'Compra materiales', 800.00, 'transfer', 'completed', CURRENT_DATE, NULL),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'egreso', 'nómina', 'Pago asistente', 3000.00, 'transfer', 'completed', CURRENT_DATE, NULL);

-- Leads demo
INSERT INTO leads (id, name, email, phone, source, status, score, interest, location_id, notes)
VALUES
  (gen_random_uuid(), 'Fernando Reyes', 'fernando.reyes2@gmail.com', '311-100-2000', 'google_ads', 'new', 80, 'Implantes', '11111111-1111-1111-1111-111111111111', 'Interesado en implantes'),
  (gen_random_uuid(), 'Mónica Salazar', 'monica.salazar2@hotmail.com', '322-200-3000', 'facebook', 'contacted', 65, 'Ortodoncia', '22222222-2222-2222-2222-222222222222', 'Cotización enviada'),
  (gen_random_uuid(), 'Alberto Cruz', 'alberto.cruz2@yahoo.com', '322-300-4000', 'referral', 'qualified', 90, 'Blanqueamiento', '33333333-3333-3333-3333-333333333333', 'Referido'),
  (gen_random_uuid(), 'Lucía Vargas', 'lucia.vargas2@gmail.com', '322-400-5000', 'instagram', 'new', 55, 'Consulta', '44444444-4444-4444-4444-444444444444', 'Primera consulta'),
  (gen_random_uuid(), 'Diego Herrera', 'diego.herrera2@outlook.com', '33-500-6000', 'website', 'won', 95, 'Carillas', '55555555-5555-5555-5555-555555555555', 'Convertido');

-- Inventario demo
INSERT INTO inventory (id, name, category, quantity, unit, min_stock, unit_cost, supplier, location_id, description)
VALUES
  (gen_random_uuid(), 'Resina Composite A2', 'restauraciones', 50, 'jeringa', 10, 180.00, 'Dental Depot', '11111111-1111-1111-1111-111111111111', 'Resina fotocurable'),
  (gen_random_uuid(), 'Anestesia Lidocaína', 'anestésicos', 100, 'cartucho', 20, 25.00, 'Dental Depot', '22222222-2222-2222-2222-222222222222', 'Lidocaína 2%'),
  (gen_random_uuid(), 'Guantes Nitrilo M', 'desechables', 500, 'unidad', 100, 2.50, 'Medilab', '33333333-3333-3333-3333-333333333333', 'Talla M'),
  (gen_random_uuid(), 'Cemento Dual', 'cementación', 20, 'kit', 5, 450.00, 'Ivoclar', '44444444-4444-4444-4444-444444444444', 'Cemento dual'),
  (gen_random_uuid(), 'Limas K-Files 25', 'endodoncia', 80, 'unidad', 20, 35.00, 'Dentsply', '55555555-5555-5555-5555-555555555555', 'K-Files #25');

-- Cajas registradoras
INSERT INTO cash_register (id, location_id, opening_amount, status, opened_at, expected_amount)
VALUES
  ('cccccccc-4444-4444-4444-cccccccccccc', '44444444-4444-4444-4444-444444444444', 3000.00, 'open', NOW(), 3000.00),
  ('cccccccc-5555-5555-5555-cccccccccccc', '55555555-5555-5555-5555-555555555555', 5000.00, 'open', NOW(), 5000.00)
ON CONFLICT (id) DO NOTHING;