-- Add admin_memo column to whitelist table for speaker/master notes
ALTER TABLE public.whitelist 
ADD COLUMN admin_memo text DEFAULT NULL;