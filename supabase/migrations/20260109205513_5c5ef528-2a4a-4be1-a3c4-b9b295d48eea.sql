-- Add confirmation token column for email confirmations
ALTER TABLE public.appointments
ADD COLUMN confirmation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster token lookups
CREATE INDEX idx_appointments_confirmation_token ON public.appointments(confirmation_token);

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule reminder job to run every day at 8:00 AM (UTC-6 Mexico time = 14:00 UTC)
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fpqzuowfzmqyiftumshk.supabase.co/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcXp1b3dmem1xeWlmdHVtc2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODEzMzUsImV4cCI6MjA4MzU1NzMzNX0.oTulxj9MjY6QvQvCyx4AUghdHIyxUuPyQfnFlvsNrcs'
    ),
    body := '{}'::jsonb
  );
  $$
);