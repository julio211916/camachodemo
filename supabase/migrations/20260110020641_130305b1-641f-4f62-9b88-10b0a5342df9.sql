-- Create scheduled_emails table for scheduling email campaigns
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  target_emails TEXT[], -- null means all patients
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  result JSONB,
  template_id UUID REFERENCES public.email_templates(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Allow staff to manage scheduled emails
CREATE POLICY "Staff can view scheduled emails" 
ON public.scheduled_emails 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
  OR public.has_role(auth.uid(), 'doctor')
  OR created_by = auth.uid()
);

CREATE POLICY "Staff can create scheduled emails" 
ON public.scheduled_emails 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
  OR public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Staff can update scheduled emails" 
ON public.scheduled_emails 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR created_by = auth.uid()
);

CREATE POLICY "Admins can delete scheduled emails" 
ON public.scheduled_emails 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR created_by = auth.uid()
);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
BEFORE UPDATE ON public.scheduled_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();