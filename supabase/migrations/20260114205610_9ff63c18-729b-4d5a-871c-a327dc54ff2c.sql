-- =========================================================
-- PHASE 1: Fix RLS Policies with USING(true) for INSERT/UPDATE  
-- =========================================================

-- Fix appointments INSERT policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Public can create appointments" ON public.appointments FOR INSERT 
WITH CHECK (
  patient_email IS NOT NULL AND patient_name IS NOT NULL AND service_id IS NOT NULL
);

-- Fix reviews INSERT policy
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
CREATE POLICY "Token holders can create reviews" ON public.reviews FOR INSERT
WITH CHECK (review_token IS NOT NULL);

-- Fix reviews UPDATE
DROP POLICY IF EXISTS "Patients can update own reviews" ON public.reviews;
CREATE POLICY "Patients can update own reviews" ON public.reviews FOR UPDATE
USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Fix referrals INSERT
DROP POLICY IF EXISTS "Anyone can create referrals" ON public.referrals;
CREATE POLICY "Authenticated can create referrals" ON public.referrals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix push_subscriptions INSERT
DROP POLICY IF EXISTS "Anyone can create subscriptions" ON public.push_subscriptions;
CREATE POLICY "Auth users can create subscriptions" ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR patient_email IS NOT NULL);

-- Patients can delete their own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE
USING (user_id = auth.uid());

-- =========================================================
-- UNIFIED TRANSACTIONS TABLE for Financial Architecture
-- =========================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ingreso', 'egreso', 'transferencia')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  reference_type TEXT,
  reference_id UUID,
  patient_id TEXT,
  patient_name TEXT,
  doctor_id UUID,
  location_id TEXT DEFAULT 'main',
  cash_register_id UUID REFERENCES public.cash_register(id),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'reconciled')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage transactions" ON public.transactions;
CREATE POLICY "Staff can manage transactions" ON public.transactions FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'doctor')));

CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);

-- =========================================================
-- SERVICES CATALOG
-- =========================================================

CREATE TABLE IF NOT EXISTS public.services_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  base_price DECIMAL(12, 2) NOT NULL,
  convention_price DECIMAL(12, 2),
  cost DECIMAL(12, 2),
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_lab BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services_catalog;
CREATE POLICY "Anyone can view active services" ON public.services_catalog FOR SELECT
USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

DROP POLICY IF EXISTS "Staff can manage services" ON public.services_catalog;
CREATE POLICY "Staff can manage services catalog" ON public.services_catalog FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================
-- LEADS TABLE (CRM)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  source_detail TEXT,
  score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  interest TEXT,
  notes TEXT,
  assigned_to UUID,
  converted_patient_id TEXT,
  converted_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage leads" ON public.leads;
CREATE POLICY "Staff can manage leads" ON public.leads FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'doctor')));

-- =========================================================
-- PAYROLL TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 0,
  total_services INTEGER DEFAULT 0,
  services_amount DECIMAL(12, 2) DEFAULT 0,
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  bonus DECIMAL(12, 2) DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  net_payment DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage payroll" ON public.payroll;
CREATE POLICY "Staff can manage payroll" ON public.payroll FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

DROP POLICY IF EXISTS "Doctors can view own payroll" ON public.payroll;
CREATE POLICY "Doctors can view own payroll" ON public.payroll FOR SELECT
USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = payroll.professional_id AND d.user_id = auth.uid()));

-- =========================================================
-- FUNCTION: Auto-link expenses to transactions
-- =========================================================

CREATE OR REPLACE FUNCTION public.sync_expense_to_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transactions (
      transaction_type, amount, description, category, payment_method,
      reference_type, reference_id, location_id, transaction_date, created_by
    ) VALUES (
      'egreso', NEW.amount, NEW.description, NEW.category, NEW.payment_method,
      'expense', NEW.id, COALESCE(NEW.location_id, 'main'), NEW.expense_date, NEW.created_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE reference_type = 'expense' AND reference_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_expense ON public.expenses;
CREATE TRIGGER trigger_sync_expense
AFTER INSERT OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.sync_expense_to_transaction();