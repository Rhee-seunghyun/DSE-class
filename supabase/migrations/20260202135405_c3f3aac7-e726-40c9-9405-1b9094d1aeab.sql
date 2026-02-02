-- Add new columns to whitelist table for enhanced student management
ALTER TABLE public.whitelist
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS business_registration boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_issued boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS survey_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_sent boolean NOT NULL DEFAULT false;