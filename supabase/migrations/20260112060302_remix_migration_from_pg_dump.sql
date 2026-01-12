CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'staff',
    'user',
    'patient',
    'doctor'
);


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);


--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_referral_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'doctor' THEN 2 
      WHEN 'staff' THEN 3 
      WHEN 'patient' THEN 4 
    END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_chat_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    patient_id uuid,
    conversation_type text DEFAULT 'general'::text NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id text NOT NULL,
    location_name text NOT NULL,
    service_id text NOT NULL,
    service_name text NOT NULL,
    appointment_date date NOT NULL,
    appointment_time text NOT NULL,
    patient_name text NOT NULL,
    patient_phone text NOT NULL,
    patient_email text NOT NULL,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_sent timestamp with time zone,
    confirmation_token uuid DEFAULT gen_random_uuid(),
    confirmed_at timestamp with time zone,
    review_token uuid DEFAULT gen_random_uuid(),
    review_sent_at timestamp with time zone,
    doctor_id uuid,
    referral_code text,
    referred_by uuid
);


--
-- Name: cash_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_register (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id text NOT NULL,
    opening_amount numeric(10,2) DEFAULT 0 NOT NULL,
    closing_amount numeric(10,2),
    expected_amount numeric(10,2),
    difference numeric(10,2),
    status text DEFAULT 'open'::text NOT NULL,
    opened_by uuid,
    closed_by uuid,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    notes text,
    CONSTRAINT cash_register_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: cash_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cash_register_id uuid NOT NULL,
    transaction_type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'efectivo'::text NOT NULL,
    description text,
    reference_type text,
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cash_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['ingreso'::text, 'egreso'::text])))
);


--
-- Name: doctor_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_appointments integer DEFAULT 0,
    total_treatments numeric(10,2) DEFAULT 0,
    commission_rate numeric(5,2) DEFAULT 30,
    commission_amount numeric(10,2) NOT NULL,
    bonus numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    net_payment numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT doctor_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    specialty text NOT NULL,
    license_number text NOT NULL,
    bio text,
    consultation_fee numeric(10,2),
    available_days text[] DEFAULT ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text],
    working_hours_start time without time zone DEFAULT '09:00:00'::time without time zone,
    working_hours_end time without time zone DEFAULT '18:00:00'::time without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
    global_styles jsonb DEFAULT '{}'::jsonb NOT NULL,
    category text DEFAULT 'custom'::text,
    is_default boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'efectivo'::text,
    receipt_url text,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    created_by uuid,
    location_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 5 NOT NULL,
    unit text DEFAULT 'unidad'::text NOT NULL,
    unit_cost numeric(10,2),
    supplier text,
    location_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inventory_id uuid NOT NULL,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    reason text,
    performed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['entrada'::text, 'salida'::text, 'ajuste'::text])))
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    treatment_id uuid,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    patient_id uuid NOT NULL,
    patient_name text NOT NULL,
    patient_email text,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    notes text,
    pdf_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'partial'::text, 'cancelled'::text])))
);


--
-- Name: lab_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    patient_name text NOT NULL,
    doctor_id uuid,
    lab_name text NOT NULL,
    work_type text NOT NULL,
    description text,
    color_shade text,
    status text DEFAULT 'pending'::text NOT NULL,
    estimated_date date,
    delivery_date date,
    cost numeric(10,2),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lab_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'ready'::text, 'delivered'::text, 'cancelled'::text])))
);


--
-- Name: medical_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    allergies text[],
    medications text[],
    conditions text[],
    blood_type text,
    emergency_contact_name text,
    emergency_contact_phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: odontogram; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.odontogram (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    tooth_number integer NOT NULL,
    surface text,
    condition text NOT NULL,
    treatment_done text,
    notes text,
    recorded_by uuid,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orthodontics_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orthodontics_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid,
    case_type text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    estimated_end_date date,
    actual_end_date date,
    bracket_type text,
    initial_diagnosis text,
    treatment_objectives text,
    current_phase text DEFAULT 'inicial'::text,
    total_visits integer DEFAULT 0,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orthodontics_cases_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'suspended'::text, 'cancelled'::text])))
);


--
-- Name: orthodontics_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orthodontics_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    visit_date date DEFAULT CURRENT_DATE NOT NULL,
    procedure_done text,
    wire_used text,
    next_appointment_notes text,
    photos_urls text[],
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: patient_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type text,
    description text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'efectivo'::text NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    installment_number integer,
    total_installments integer,
    notes text,
    received_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: periodontogram; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodontogram (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    tooth_number integer NOT NULL,
    pocket_depth_vestibular integer[],
    pocket_depth_lingual integer[],
    recession_vestibular integer[],
    recession_lingual integer[],
    bleeding boolean DEFAULT false,
    suppuration boolean DEFAULT false,
    mobility integer DEFAULT 0,
    furcation integer DEFAULT 0,
    recorded_by uuid,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    date_of_birth date,
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    patient_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_patient_id uuid NOT NULL,
    referrer_email text NOT NULL,
    referred_email text NOT NULL,
    referred_patient_id uuid,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    discount_percentage numeric DEFAULT 5,
    discount_amount numeric,
    completed_at timestamp with time zone,
    discount_applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    patient_name text NOT NULL,
    patient_email text NOT NULL,
    location_id text NOT NULL,
    location_name text NOT NULL,
    service_id text NOT NULL,
    service_name text NOT NULL,
    rating integer NOT NULL,
    comment text,
    is_published boolean DEFAULT false,
    review_token uuid DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: scheduled_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    html_content text NOT NULL,
    target_emails text[],
    scheduled_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    result jsonb,
    template_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scheduled_emails_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: treatments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid,
    appointment_id uuid,
    name text NOT NULL,
    description text,
    diagnosis text,
    treatment_plan text,
    notes text,
    cost numeric(10,2),
    status text DEFAULT 'in_progress'::text,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT treatments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_chat_history ai_chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_history
    ADD CONSTRAINT ai_chat_history_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: cash_register cash_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register
    ADD CONSTRAINT cash_register_pkey PRIMARY KEY (id);


--
-- Name: cash_transactions cash_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_pkey PRIMARY KEY (id);


--
-- Name: doctor_payments doctor_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_payments
    ADD CONSTRAINT doctor_payments_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_key UNIQUE (user_id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_orders lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_pkey PRIMARY KEY (id);


--
-- Name: medical_history medical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_pkey PRIMARY KEY (id);


--
-- Name: odontogram odontogram_patient_id_tooth_number_surface_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogram
    ADD CONSTRAINT odontogram_patient_id_tooth_number_surface_key UNIQUE (patient_id, tooth_number, surface);


--
-- Name: odontogram odontogram_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogram
    ADD CONSTRAINT odontogram_pkey PRIMARY KEY (id);


--
-- Name: orthodontics_cases orthodontics_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_cases
    ADD CONSTRAINT orthodontics_cases_pkey PRIMARY KEY (id);


--
-- Name: orthodontics_visits orthodontics_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_visits
    ADD CONSTRAINT orthodontics_visits_pkey PRIMARY KEY (id);


--
-- Name: patient_documents patient_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_documents
    ADD CONSTRAINT patient_documents_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: periodontogram periodontogram_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodontogram
    ADD CONSTRAINT periodontogram_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_key UNIQUE (referral_code);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: scheduled_emails scheduled_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_emails
    ADD CONSTRAINT scheduled_emails_pkey PRIMARY KEY (id);


--
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_appointments_confirmation_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmation_token ON public.appointments USING btree (confirmation_token);


--
-- Name: idx_appointments_date_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date_time ON public.appointments USING btree (appointment_date, appointment_time);


--
-- Name: idx_appointments_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_location ON public.appointments USING btree (location_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_referrals_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referral_code ON public.referrals USING btree (referral_code);


--
-- Name: idx_referrals_referred_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referred_email ON public.referrals USING btree (referred_email);


--
-- Name: idx_referrals_referrer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referrer_email ON public.referrals USING btree (referrer_email);


--
-- Name: idx_reviews_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_location ON public.reviews USING btree (location_id);


--
-- Name: idx_reviews_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_published ON public.reviews USING btree (is_published);


--
-- Name: idx_reviews_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_token ON public.reviews USING btree (review_token);


--
-- Name: ai_chat_history update_ai_chat_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_chat_history_updated_at BEFORE UPDATE ON public.ai_chat_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: doctors update_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_templates update_email_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lab_orders update_lab_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: medical_history update_medical_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON public.medical_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orthodontics_cases update_orthodontics_cases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orthodontics_cases_updated_at BEFORE UPDATE ON public.orthodontics_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referrals update_referrals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_emails update_scheduled_emails_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_emails_updated_at BEFORE UPDATE ON public.scheduled_emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: treatments update_treatments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: cash_transactions cash_transactions_cash_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_register(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_templates email_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: inventory_movements inventory_movements_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_treatment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id);


--
-- Name: orthodontics_visits orthodontics_visits_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_visits
    ADD CONSTRAINT orthodontics_visits_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.orthodontics_cases(id) ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: scheduled_emails scheduled_emails_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_emails
    ADD CONSTRAINT scheduled_emails_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: scheduled_emails scheduled_emails_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_emails
    ADD CONSTRAINT scheduled_emails_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id);


--
-- Name: treatments treatments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: treatments treatments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: doctor_payments Admin can manage doctor payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage doctor payments" ON public.doctor_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: doctors Admin can manage doctors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage doctors" ON public.doctors USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: expenses Admin can manage expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage expenses" ON public.expenses USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admin can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: appointments Admins can delete appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Admins can delete reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: scheduled_emails Admins can delete scheduled emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete scheduled emails" ON public.scheduled_emails FOR DELETE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: email_templates Admins can delete templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete templates" ON public.email_templates FOR DELETE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can update referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update referrals" ON public.referrals FOR UPDATE USING (true);


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: appointments Anyone can create appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: push_subscriptions Anyone can create push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);


--
-- Name: referrals Anyone can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create referrals" ON public.referrals FOR INSERT WITH CHECK (true);


--
-- Name: reviews Anyone can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: doctors Anyone can view active doctors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active doctors" ON public.doctors FOR SELECT USING ((is_active = true));


--
-- Name: patient_documents Clinical staff can manage documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinical staff can manage documents" ON public.patient_documents USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: odontogram Clinical staff can manage odontogram; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinical staff can manage odontogram" ON public.odontogram USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: orthodontics_visits Clinical staff can manage ortho visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinical staff can manage ortho visits" ON public.orthodontics_visits USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: orthodontics_cases Clinical staff can manage orthodontics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinical staff can manage orthodontics" ON public.orthodontics_cases USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: periodontogram Clinical staff can manage periodontogram; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinical staff can manage periodontogram" ON public.periodontogram USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: doctors Doctors can update their own info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors can update their own info" ON public.doctors FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: inventory Doctors can view inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors can view inventory" ON public.inventory FOR SELECT USING (public.has_role(auth.uid(), 'doctor'::public.app_role));


--
-- Name: doctor_payments Doctors can view their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors can view their payments" ON public.doctor_payments FOR SELECT USING ((doctor_id = auth.uid()));


--
-- Name: medical_history Patients can update their own medical history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can update their own medical history" ON public.medical_history FOR UPDATE USING ((patient_id = auth.uid()));


--
-- Name: patient_documents Patients can view their documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their documents" ON public.patient_documents FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: invoices Patients can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their invoices" ON public.invoices FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: odontogram Patients can view their odontogram; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their odontogram" ON public.odontogram FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: orthodontics_cases Patients can view their orthodontics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their orthodontics" ON public.orthodontics_cases FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: medical_history Patients can view their own medical history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their own medical history" ON public.medical_history FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: treatments Patients can view their own treatments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their own treatments" ON public.treatments FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: periodontogram Patients can view their periodontogram; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their periodontogram" ON public.periodontogram FOR SELECT USING ((patient_id = auth.uid()));


--
-- Name: reviews Published reviews are visible to everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published reviews are visible to everyone" ON public.reviews FOR SELECT USING ((is_published = true));


--
-- Name: scheduled_emails Staff can create scheduled emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create scheduled emails" ON public.scheduled_emails FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: email_templates Staff can create templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create templates" ON public.email_templates FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: cash_register Staff can manage cash register; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage cash register" ON public.cash_register USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: cash_transactions Staff can manage cash transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage cash transactions" ON public.cash_transactions USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: inventory Staff can manage inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage inventory" ON public.inventory USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: inventory_movements Staff can manage inventory movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage inventory movements" ON public.inventory_movements USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: invoice_items Staff can manage invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage invoice items" ON public.invoice_items USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: invoices Staff can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage invoices" ON public.invoices USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: lab_orders Staff can manage lab orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage lab orders" ON public.lab_orders USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: medical_history Staff can manage medical history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage medical history" ON public.medical_history USING ((public.has_role(auth.uid(), 'doctor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: payments Staff can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage payments" ON public.payments USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: treatments Staff can manage treatments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage treatments" ON public.treatments USING ((public.has_role(auth.uid(), 'doctor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: appointments Staff can update appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: reviews Staff can update reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update reviews" ON public.reviews FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: scheduled_emails Staff can update scheduled emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update scheduled emails" ON public.scheduled_emails FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: email_templates Staff can update their templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update their templates" ON public.email_templates FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: appointments Staff can view all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all appointments" ON public.appointments FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: medical_history Staff can view all medical history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all medical history" ON public.medical_history FOR SELECT USING ((public.has_role(auth.uid(), 'doctor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: profiles Staff can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: reviews Staff can view all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all reviews" ON public.reviews FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: email_templates Staff can view all templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all templates" ON public.email_templates FOR SELECT USING (((is_default = true) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: expenses Staff can view expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT USING (public.has_role(auth.uid(), 'staff'::public.app_role));


--
-- Name: scheduled_emails Staff can view scheduled emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view scheduled emails" ON public.scheduled_emails FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role) OR (created_by = auth.uid())));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_chat_history Users can manage their AI chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their AI chats" ON public.ai_chat_history USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'doctor'::public.app_role)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT USING (true);


--
-- Name: ai_chat_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_register; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: doctor_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doctor_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: doctors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: medical_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

--
-- Name: odontogram; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.odontogram ENABLE ROW LEVEL SECURITY;

--
-- Name: orthodontics_cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orthodontics_cases ENABLE ROW LEVEL SECURITY;

--
-- Name: orthodontics_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orthodontics_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: periodontogram; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.periodontogram ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

--
-- Name: treatments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;