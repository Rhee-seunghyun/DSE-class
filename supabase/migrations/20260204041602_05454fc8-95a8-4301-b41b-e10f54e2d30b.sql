-- Fix RLS policies for anonymous form submission

-- 1. Drop the existing restrictive policy for form_responses INSERT
DROP POLICY IF EXISTS "Anyone can submit responses to active forms" ON public.form_responses;

-- 2. Create a PERMISSIVE policy for anonymous/authenticated users to submit to active forms
CREATE POLICY "Anyone can submit responses to active forms"
ON public.form_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM application_forms af
    WHERE af.id = form_responses.form_id AND af.is_active = true
  )
);

-- 3. Add policy for anonymous users to insert into whitelist when submitting application
CREATE POLICY "Anyone can submit application to whitelist"
ON public.whitelist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Must have a valid form_response_id that links to an active form
  form_response_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM form_responses fr
    JOIN application_forms af ON af.id = fr.form_id
    WHERE fr.id = whitelist.form_response_id
    AND af.is_active = true
    AND af.lecture_id = whitelist.lecture_id
    AND af.speaker_id = whitelist.speaker_id
  )
);