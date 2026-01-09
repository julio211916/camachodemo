-- Agregar nuevos roles al enum (se deben confirmar antes de usar)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'patient';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';