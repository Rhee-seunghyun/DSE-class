-- Link whitelist entries to form_responses to prevent missing/duplicate sync
ALTER TABLE public.whitelist
ADD COLUMN form_response_id uuid NULL;

-- Optional FK for integrity (nullable)
ALTER TABLE public.whitelist
ADD CONSTRAINT whitelist_form_response_id_fkey
FOREIGN KEY (form_response_id)
REFERENCES public.form_responses(id)
ON DELETE SET NULL;

-- Unique index for non-null form_response_id (allows multiple NULLs)
CREATE UNIQUE INDEX whitelist_form_response_id_unique
ON public.whitelist(form_response_id)
WHERE form_response_id IS NOT NULL;