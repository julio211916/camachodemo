-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de doctores (información adicional)
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL,
  bio TEXT,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de tratamientos
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  appointment_id UUID REFERENCES public.appointments(id),
  name TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  cost DECIMAL(10,2),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de historial médico
CREATE TABLE public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  allergies TEXT[],
  medications TEXT[],
  conditions TEXT[],
  blood_type TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Políticas para doctors
CREATE POLICY "Anyone can view active doctors" ON public.doctors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Doctors can update their own info" ON public.doctors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage doctors" ON public.doctors
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para treatments
CREATE POLICY "Patients can view their own treatments" ON public.treatments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Staff can manage treatments" ON public.treatments
  FOR ALL USING (
    has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Políticas para medical_history
CREATE POLICY "Patients can view their own medical history" ON public.medical_history
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients can update their own medical history" ON public.medical_history
  FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Staff can view all medical history" ON public.medical_history
  FOR SELECT USING (
    has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Staff can manage medical history" ON public.medical_history
  FOR ALL USING (
    has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin')
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at
  BEFORE UPDATE ON public.medical_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para obtener el rol principal del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Agregar columna doctor_id a appointments para asignar citas a doctores específicos
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id);

-- Habilitar realtime para las nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatments;