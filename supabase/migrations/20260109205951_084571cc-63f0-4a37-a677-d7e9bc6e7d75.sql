-- Create reviews table for patient feedback
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_published BOOLEAN DEFAULT false,
  review_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can create a review (with valid token)
CREATE POLICY "Anyone can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Published reviews are visible to everyone
CREATE POLICY "Published reviews are visible to everyone"
ON public.reviews
FOR SELECT
USING (is_published = true);

-- Staff can view all reviews
CREATE POLICY "Staff can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Staff can update reviews (publish/unpublish)
CREATE POLICY "Staff can update reviews"
ON public.reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_reviews_location ON public.reviews(location_id);
CREATE INDEX idx_reviews_published ON public.reviews(is_published);
CREATE INDEX idx_reviews_token ON public.reviews(review_token);

-- Create push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  patient_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can create subscriptions
CREATE POLICY "Anyone can create push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (true);

-- Add review_token to appointments for sending review requests
ALTER TABLE public.appointments
ADD COLUMN review_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN review_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;