-- Add reminder_sent column to track when reminders were sent
ALTER TABLE public.appointments
ADD COLUMN reminder_sent TIMESTAMP WITH TIME ZONE DEFAULT NULL;