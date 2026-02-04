-- Fix whitelist INSERT RLS: current policy checks form_responses via a subquery, but anon/authenticated cannot SELECT from form_responses under RLS,
-- causing EXISTS() to be false and INSERT to fail. Use a SECURITY DEFINER function to validate without exposing PII.

CREATE OR REPLACE FUNCTION public.is_valid_whitelist_submission(
  _form_response_id uuid,
  _lecture_id uuid,
  _speaker_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.form_responses fr
    JOIN public.application_forms af ON af.id = fr.form_id
    WHERE fr.id = _form_response_id
      AND af.is_active = true
      AND af.lecture_id = _lecture_id
      AND af.speaker_id = _speaker_id
  );
$$;

-- Recreate whitelist insert policy to use the definer function
DROP POLICY IF EXISTS "Anyone can submit application to whitelist" ON public.whitelist;

CREATE POLICY "Anyone can submit application to whitelist"
ON public.whitelist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  form_response_id IS NOT NULL
  AND public.is_valid_whitelist_submission(form_response_id, lecture_id, speaker_id)
);
