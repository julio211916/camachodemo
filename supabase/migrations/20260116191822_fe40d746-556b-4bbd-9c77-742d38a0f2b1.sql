-- Add new roles to app_role enum for e-commerce
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'distributor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'customer';