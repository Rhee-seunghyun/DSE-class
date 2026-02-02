-- Add is_new_student column to whitelist table to distinguish new vs returning students
ALTER TABLE public.whitelist 
ADD COLUMN is_new_student boolean NOT NULL DEFAULT true;