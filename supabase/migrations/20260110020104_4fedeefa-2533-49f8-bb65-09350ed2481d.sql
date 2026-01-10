-- Create email_templates table for saving custom templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  global_styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins and staff to manage templates
CREATE POLICY "Staff can view all templates" 
ON public.email_templates 
FOR SELECT 
USING (
  is_default = true 
  OR public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
  OR public.has_role(auth.uid(), 'doctor')
  OR created_by = auth.uid()
);

CREATE POLICY "Staff can create templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
  OR public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Staff can update their templates" 
ON public.email_templates 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR created_by = auth.uid()
);

CREATE POLICY "Admins can delete templates" 
ON public.email_templates 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR created_by = auth.uid()
);

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();