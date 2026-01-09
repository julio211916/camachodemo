-- Inventory Management
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'unidad',
  unit_cost NUMERIC(10,2),
  supplier TEXT,
  location_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Movements
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'efectivo',
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  location_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cash Register
CREATE TABLE public.cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  opening_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(10,2),
  expected_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_by UUID,
  closed_by UUID,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Cash Transactions
CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID REFERENCES public.cash_register(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ingreso', 'egreso')),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'cancelled')),
  due_date DATE,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoice Items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  treatment_id UUID REFERENCES public.treatments(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments (for installment plans)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_number INTEGER,
  total_installments INTEGER,
  notes TEXT,
  received_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lab Orders
CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id UUID,
  lab_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  description TEXT,
  color_shade TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')),
  estimated_date DATE,
  delivery_date DATE,
  cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Odontogram Data
CREATE TABLE public.odontogram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  tooth_number INTEGER NOT NULL,
  surface TEXT,
  condition TEXT NOT NULL,
  treatment_done TEXT,
  notes TEXT,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, tooth_number, surface)
);

-- Periodontogram Data
CREATE TABLE public.periodontogram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  tooth_number INTEGER NOT NULL,
  pocket_depth_vestibular INTEGER[],
  pocket_depth_lingual INTEGER[],
  recession_vestibular INTEGER[],
  recession_lingual INTEGER[],
  bleeding BOOLEAN DEFAULT false,
  suppuration BOOLEAN DEFAULT false,
  mobility INTEGER DEFAULT 0,
  furcation INTEGER DEFAULT 0,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient Documents
CREATE TABLE public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orthodontics Cases
CREATE TABLE public.orthodontics_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID,
  case_type TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  bracket_type TEXT,
  initial_diagnosis TEXT,
  treatment_objectives TEXT,
  current_phase TEXT DEFAULT 'inicial',
  total_visits INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orthodontics Visits
CREATE TABLE public.orthodontics_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.orthodontics_cases(id) ON DELETE CASCADE NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  procedure_done TEXT,
  wire_used TEXT,
  next_appointment_notes TEXT,
  photos_urls TEXT[],
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Doctor Payments
CREATE TABLE public.doctor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_appointments INTEGER DEFAULT 0,
  total_treatments NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 30,
  commission_amount NUMERIC(10,2) NOT NULL,
  bonus NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  net_payment NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Chat History for diagnostic assistant
CREATE TABLE public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  patient_id UUID,
  conversation_type TEXT NOT NULL DEFAULT 'general',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodontogram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orthodontics_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orthodontics_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Inventory
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Doctors can view inventory" ON public.inventory FOR SELECT
USING (has_role(auth.uid(), 'doctor'));

-- RLS Policies for Inventory Movements
CREATE POLICY "Staff can manage inventory movements" ON public.inventory_movements FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for Expenses
CREATE POLICY "Admin can manage expenses" ON public.expenses FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- RLS Policies for Cash Register
CREATE POLICY "Staff can manage cash register" ON public.cash_register FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for Cash Transactions
CREATE POLICY "Staff can manage cash transactions" ON public.cash_transactions FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for Invoices
CREATE POLICY "Staff can manage invoices" ON public.invoices FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Patients can view their invoices" ON public.invoices FOR SELECT
USING (patient_id = auth.uid());

-- RLS Policies for Invoice Items
CREATE POLICY "Staff can manage invoice items" ON public.invoice_items FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for Payments
CREATE POLICY "Staff can manage payments" ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for Lab Orders
CREATE POLICY "Staff can manage lab orders" ON public.lab_orders FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

-- RLS Policies for Odontogram
CREATE POLICY "Clinical staff can manage odontogram" ON public.odontogram FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients can view their odontogram" ON public.odontogram FOR SELECT
USING (patient_id = auth.uid());

-- RLS Policies for Periodontogram
CREATE POLICY "Clinical staff can manage periodontogram" ON public.periodontogram FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients can view their periodontogram" ON public.periodontogram FOR SELECT
USING (patient_id = auth.uid());

-- RLS Policies for Patient Documents
CREATE POLICY "Clinical staff can manage documents" ON public.patient_documents FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients can view their documents" ON public.patient_documents FOR SELECT
USING (patient_id = auth.uid());

-- RLS Policies for Orthodontics Cases
CREATE POLICY "Clinical staff can manage orthodontics" ON public.orthodontics_cases FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients can view their orthodontics" ON public.orthodontics_cases FOR SELECT
USING (patient_id = auth.uid());

-- RLS Policies for Orthodontics Visits
CREATE POLICY "Clinical staff can manage ortho visits" ON public.orthodontics_visits FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

-- RLS Policies for Doctor Payments
CREATE POLICY "Admin can manage doctor payments" ON public.doctor_payments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view their payments" ON public.doctor_payments FOR SELECT
USING (doctor_id = auth.uid());

-- RLS Policies for AI Chat
CREATE POLICY "Users can manage their AI chats" ON public.ai_chat_history FOR ALL
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));

-- Triggers for updated_at
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orthodontics_cases_updated_at BEFORE UPDATE ON public.orthodontics_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_history_updated_at BEFORE UPDATE ON public.ai_chat_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

-- Storage policies
CREATE POLICY "Staff can upload documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-documents' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor')
));

CREATE POLICY "Staff can view all documents" ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor')
));

CREATE POLICY "Staff can delete documents" ON storage.objects FOR DELETE
USING (bucket_id = 'patient-documents' AND has_role(auth.uid(), 'admin'));